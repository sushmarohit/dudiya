import { Injectable, Logger } from '@nestjs/common';
import { DOMMatrix, Image, ImageData, Path2D } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';

// pdfjs-dist (via pdf-parse) expects browser globals; set them before require.
Object.assign(globalThis, { DOMMatrix, Path2D, ImageData, Image });

// Subpath exports need node16+ moduleResolution; Nest uses classic CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CanvasFactory } = require('pdf-parse/worker') as {
  CanvasFactory: new () => unknown;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as typeof import('pdf-parse');

export interface OcrExtractResult {
  text: string;
  engine: 'tesseract' | 'pdf-text' | 'pdf-ocr' | 'none';
  /** Truncated snippet for storage / debugging */
  snippet: string;
}

const MIN_USEFUL_CHARS = 12;
const SNIPPET_MAX = 500;

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractText(
    buffer: Buffer,
    mimeType: string,
  ): Promise<OcrExtractResult> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractFromPdf(buffer);
      }
      if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
        const text = await this.recognizeImage(buffer);
        return this.wrap(text, 'tesseract');
      }
      return { text: '', engine: 'none', snippet: '' };
    } catch (err) {
      this.logger.warn(
        `OCR extract failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { text: '', engine: 'none', snippet: '' };
    }
  }

  private wrap(
    text: string,
    engine: OcrExtractResult['engine'],
  ): OcrExtractResult {
    const cleaned = text.replace(/\u0000/g, ' ').trim();
    return {
      text: cleaned,
      engine,
      snippet: cleaned.slice(0, SNIPPET_MAX),
    };
  }

  private async extractFromPdf(buffer: Buffer): Promise<OcrExtractResult> {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
      CanvasFactory,
    });
    try {
      const textResult = await parser.getText();
      const embedded = (textResult?.text ?? '').trim();
      if (this.isUseful(embedded)) {
        return this.wrap(embedded, 'pdf-text');
      }

      // Scanned / image-only PDF: render first page and OCR
      const shots = await parser.getScreenshot({
        first: 1,
        scale: 2,
        imageBuffer: true,
      });
      const page = shots.pages?.[0];
      if (!page?.data?.length) {
        return this.wrap(embedded, embedded ? 'pdf-text' : 'none');
      }
      const png = Buffer.from(page.data);
      const ocrText = await this.recognizeImage(png);
      if (this.isUseful(ocrText)) {
        return this.wrap(ocrText, 'pdf-ocr');
      }
      return this.wrap(embedded || ocrText, embedded ? 'pdf-text' : 'pdf-ocr');
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  private isUseful(text: string): boolean {
    const letters = text.replace(/[^a-zA-Z\u0900-\u097F]/g, '');
    return letters.length >= MIN_USEFUL_CHARS;
  }

  private async recognizeImage(image: Buffer): Promise<string> {
    const worker = await createWorker('eng');
    try {
      const {
        data: { text },
      } = await worker.recognize(image);
      return text ?? '';
    } finally {
      await worker.terminate();
    }
  }
}
