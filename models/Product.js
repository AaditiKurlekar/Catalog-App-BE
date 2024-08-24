const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    prod_sku: {
        type: Number,
        required: true,
        unique: true
    },
    prod_Live_URL: String,
    prod_name: String,
    prod_long_desc: String,
    prod_type: String,
    prod_subcategory: String,
    prodmeta_section: String,
    prodmeta_ship_days: Number,
    prodmeta_metal_weight: String,
    prodmeta_side_diamonds_count: Number,
    prodmeta_side_diamonds_ctw: String,
    prodmeta_side_diamonds_color_clarity: String,
    prodmeta_side_diamonds1_count: Number,
    attr_14k_regular: Number,
    attr_14k_metal_available: String,
    attr_18k_regular: Number,
    attr_18k_metal_available: String,
    attr_platinum_regular: Number,
    attr_whitegold_platinum_round_default_img: String,
    attr_whitegold_platinum_round_img: String,
    attr_rosegold_round_default_img: String,
    attr_rosegold_round_img: String,
    attr_yellowgold_round_default_img: String,
    attr_yellowgold_round_img: String,
    attr_whitegold_yellow_round_default_img: String,
    attr_whitegold_yellow_round_img: String,
    attr_whitegold_rose_round_default_img: String,
    attr_whitegold_rose_round_img: String,
    attr_tricolor_round_default_img: String,
    attr_tricolor_round_img: String,
    platinum_img: {
        type: String,
        default: "https://ion.bluenile.com/sets/Jewelry-bn/194489/NOP/Images/gallery.jpg"
    },
    gold_img: {
        type: String,
        default: "https://ion.bluenile.com/sets/Jewelry-bn/195680/NOP/Images/gallery.jpg"
    },
    white_gold_img: {
        type: String,
        default: "https://ion.bluenile.com/sets/Jewelry-bn/194573/NOP/Images/gallery.jpg"
    },
    rose_gold_img: {
        type: String,
        default: "https://ion.bluenile.com/sets/Jewelry-bn/195128/NOP/Images/gallery.jpg"
    },

});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;