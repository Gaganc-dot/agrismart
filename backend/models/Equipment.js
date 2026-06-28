const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["tractor","harvester","sprayer","rotavator","seeder","cultivator",
             "plough","pump","irrigation","tools","trolley","thresher","other"],
      required: [true, "Category is required"],
    },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    yearOfManufacture: { type: Number },
    condition: {
      type: String,
      enum: ["new", "used", "refurbished"],
      required: [true, "Condition is required"],
    },
    // Sale price
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    negotiable: { type: Boolean, default: true },

    // Rental pricing (optional)
    isRental: { type: Boolean, default: false },
    rentalPricePerHour: { type: Number },
    rentalPricePerDay:  { type: Number },

    description: { type: String, default: "" },
    images: { type: [String], default: [] },

    location: { type: String, default: "" },
    contactPhone: { type: String, default: "" },

    features: { type: [String], default: [] },   // e.g. ["GPS", "AC Cabin"]
    hoursUsed: { type: Number },                  // engine hours for tractors/harvesters

    status: {
      type: String,
      enum: ["available", "sold", "rented", "reserved"],
      default: "available",
    },

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Equipment", equipmentSchema);
