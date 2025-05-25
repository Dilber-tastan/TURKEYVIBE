const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true }, // Konser, Tiyatro, Spor, Festival
  date: { type: Date, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
});

module.exports = mongoose.model('Event', eventSchema);