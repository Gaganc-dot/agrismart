const mongoose = require("mongoose");

const cropCalendarSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cropName: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    sowingDate: {
      type: Date,
      required: [true, "Sowing date is required"],
    },
    stages: [
      {
        name: {
          type: String,
          required: true,
          // No enum restriction — stage names vary per crop
        },
        note: {
          type: String,
          default: "",
        },
        dueDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "done"],
          default: "pending",
        },
        completedAt: {
          type: Date,
        },
        notifiedAt: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropCalendar", cropCalendarSchema);
