import { z } from "zod";

export type SchemaTranslator = (key: string) => string;

export function createAddressSchemas(v: SchemaTranslator, a: SchemaTranslator) {
  const addressTypeSchema = z.enum(["URBAN", "RURAL"]);

  const baseAddressFields = {
    addressType: addressTypeSchema.default("URBAN"),
    flatOrHouseNo: z.string().optional(),
    buildingOrSociety: z.string().optional(),
    streetOrLane: z.string().optional(),
    landmark: z.string().optional(),
    village: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    addressLine: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    lat: z.number().finite().nullable().optional(),
    lng: z.number().finite().nullable().optional(),
  };

  const structuredAddressSchema = z
    .object(baseAddressFields)
    .superRefine((data, ctx) => {
      const hasMapPin =
        data.lat != null && data.lng != null && !Number.isNaN(data.lat);

      if (data.addressType === "URBAN") {
        const hasLine =
          data.flatOrHouseNo?.trim() ||
          data.buildingOrSociety?.trim() ||
          data.streetOrLane?.trim() ||
          data.addressLine?.trim();
        if (!hasLine) {
          ctx.addIssue({
            code: "custom",
            message: v("addressUrbanLine"),
            path: ["flatOrHouseNo"],
          });
        }
        if (!data.city?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressCity"),
            path: ["city"],
          });
        }
        if (!hasMapPin && !data.pincode?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressPincodeOrMap"),
            path: ["pincode"],
          });
        }
      } else {
        if (!data.village?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressVillage"),
            path: ["village"],
          });
        }
        if (!data.district?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressDistrict"),
            path: ["district"],
          });
        }
        if (!data.state?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressState"),
            path: ["state"],
          });
        }
        if (!hasMapPin && !data.pincode?.trim() && !data.landmark?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: v("addressRuralLocation"),
            path: ["landmark"],
          });
        }
      }
    });

  const registerCustomerSchema = z
    .object({
      email: z.string().email(v("email")),
      name: z.string().min(2, v("nameMin")),
      password: z.string().min(8, v("password")),
      phone: z.string().optional(),
    })
    .merge(structuredAddressSchema);

  const customerProfileSchema = z
    .object({
      name: z.string().min(2, v("nameMin")).optional(),
      phone: z.string().optional(),
    })
    .merge(structuredAddressSchema);

  const businessProfileSchema = z
    .object({
      businessName: z.string().min(2, v("businessNameRequired")),
      ownerName: z.string().optional(),
      serviceRadiusKm: z.coerce.number().min(1).max(50),
    })
    .merge(structuredAddressSchema);

  const createCustomerSchema = z
    .object({
      name: z.string().min(2, v("nameMin")),
      email: z.string().email(v("email")).optional().or(z.literal("")),
      phone: z.string().min(10, v("phone")),
    })
    .merge(structuredAddressSchema);

  return {
    structuredAddressSchema,
    registerCustomerSchema,
    customerProfileSchema,
    businessProfileSchema,
    createCustomerSchema,
  };
}

export function createFormSchemas(v: SchemaTranslator) {
  const address = createAddressSchemas(v, v);

  const loginSchema = z.object({
    email: z.string().email(v("email")),
    password: z.string().min(1, v("required")),
  });

  const registerDistributorSchema = z.object({
    email: z.string().email(v("email")),
    name: z.string().min(2, v("nameMin")),
    password: z.string().min(8, v("password")),
    phone: z.string().optional(),
    businessName: z.string().min(2, v("businessNameRequired")),
    ownerName: z.string().optional(),
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email(v("email")),
  });

  const passwordConfirmRefine = {
    refine: (data: { password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    message: v("passwordsMatch"),
    path: ["confirmPassword"] as const,
  };

  const resetPasswordSchema = z
    .object({
      password: z.string().min(8, v("password")),
      confirmPassword: z.string(),
    })
    .refine(passwordConfirmRefine.refine, {
      message: passwordConfirmRefine.message,
      path: [...passwordConfirmRefine.path],
    });

  const activateSchema = z
    .object({
      password: z.string().min(8, v("password")),
      confirmPassword: z.string(),
    })
    .refine(passwordConfirmRefine.refine, {
      message: passwordConfirmRefine.message,
      path: [...passwordConfirmRefine.path],
    });

  const deliverySlotSchema = z.object({
    label: z.string().min(1, v("labelRequired")),
    startTime: z.string().min(1, v("startTimeRequired")),
    endTime: z.string().min(1, v("endTimeRequired")),
  });

  const createSubscriptionSchema = z.object({
    customerId: z.string().min(1, v("selectCustomer")),
    productId: z.string().min(1, v("selectProduct")),
    fatPercent: z.coerce.number().optional(),
    quantity: z.coerce.number().min(0.5, v("minQuantity")),
    frequency: z.enum([
      "DAILY",
      "ALTERNATE_DAY",
      "WEEKDAYS",
      "WEEKLY",
      "MONTHLY",
    ]),
    deliverySlotId: z.string().min(1, v("selectSlot")),
    startDate: z.string().min(1, v("startDateRequired")),
  });

  const customerSubscribeSchema = z.object({
    productId: z.string().min(1, v("selectProduct")),
    pricingId: z.string().min(1, v("selectProduct")),
    quantity: z.coerce.number().min(0.5, v("minQuantity")),
    frequency: z.enum([
      "DAILY",
      "ALTERNATE_DAY",
      "WEEKDAYS",
      "WEEKLY",
      "MONTHLY",
    ]),
    deliverySlotId: z.string().min(1, v("selectSlot")),
    startDate: z.string().min(1, v("startDateRequired")),
  });

  const pauseRequestSchema = z.object({
    startDate: z.string().min(1, v("startDateRequired")),
    endDate: z.string().min(1, v("endDateRequired")),
  });

  const extraRequestSchema = z.object({
    date: z.string().min(1, v("startDateRequired")),
    extraQuantity: z.coerce.number().min(0.5, v("minQuantity")),
  });

  const updateSubscriptionSchema = z.object({
    productId: z.string().min(1, v("selectProduct")),
    deliverySlotId: z.string().min(1, v("selectSlot")),
    fatPercent: z.coerce.number().optional(),
    quantity: z.coerce.number().min(0.5, v("minQuantity")),
    frequency: z.enum([
      "DAILY",
      "ALTERNATE_DAY",
      "WEEKDAYS",
      "WEEKLY",
      "MONTHLY",
    ]),
  });

  const updateCustomerSchema = address.structuredAddressSchema.extend({
    name: z.string().min(2, v("nameMin")).optional(),
    phone: z.string().optional(),
    email: z.string().email(v("email")).optional().or(z.literal("")),
  });

  const pricingSchema = z.object({
    productId: z.string().min(1, v("selectProduct")),
    fatPercent: z.coerce.number().optional(),
    pricePerUnit: z.coerce.number().min(0.01, v("minPrice")),
  });

  const rejectDistributorSchema = z.object({
    reason: z.string().min(3, v("rejectionReason")),
  });

  const platformSettingsSchema = z.object({
    pauseCutoffHour: z.coerce.number().min(0).max(23),
    pauseCutoffMinute: z.coerce.number().min(0).max(59),
    defaultRadiusKm: z.coerce.number().min(1).max(50),
  });

  return {
    ...address,
    loginSchema,
    registerDistributorSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    activateSchema,
    deliverySlotSchema,
    createSubscriptionSchema,
    customerSubscribeSchema,
    pauseRequestSchema,
    extraRequestSchema,
    updateSubscriptionSchema,
    updateCustomerSchema,
    pricingSchema,
    rejectDistributorSchema,
    platformSettingsSchema,
  };
}

export type FormSchemas = ReturnType<typeof createFormSchemas>;
export type LoginInput = FormSchemas["loginSchema"] extends z.ZodType<infer T>
  ? T
  : never;
export type RegisterDistributorInput = z.infer<
  ReturnType<typeof createFormSchemas>["registerDistributorSchema"]
>;
export type RegisterCustomerInput = z.infer<
  ReturnType<typeof createFormSchemas>["registerCustomerSchema"]
>;
export type UpdateSubscriptionInput = z.infer<
  ReturnType<typeof createFormSchemas>["updateSubscriptionSchema"]
>;
