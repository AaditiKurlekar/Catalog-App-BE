const Product = require("../models/Product")
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

let jsonData = [];
exports.uploadProductData = (req, res) => {
    jsonData = []; // Clear previous data

    try {
        // Convert the buffer into a readable stream
        const readableFile = new Readable();
        readableFile.push(req.file.buffer);
        readableFile.push(null);

        // Process the CSV data
        readableFile
            .pipe(csvParser())
            .on('data', (row) => jsonData.push(row))
            .on('end', async () => {
                try {
                    // Save each item in jsonData to MongoDB
                    await Product.insertMany(jsonData);

                    // Respond with the JSON data
                    res.json(jsonData);
                } catch (saveError) {
                    res.status(500).json({ error: 'Failed to save data to the database', saveError });
                }
            })
            .on('error', (error) => {
                res.status(500).json({ error: 'Failed to process CSV file', error });
            });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while uploading the file', error });
    }
};



exports.getAllProducts = async (req, res) => {
    const { section, ship_days, side_diamonds_count, metal_type, min_price, max_price, sort_by, page = 1, limit = 12 } = req.query;

    // Build the match stage
    const matchStage = {};

    if (section && section !== 'unisex') {
        matchStage.prodmeta_section = section;
    }
    if (ship_days) {
        const days = parseInt(ship_days, 10);
        if (!isNaN(days)) {
            matchStage.prodmeta_ship_days = { $lt: days };
        }
    }
    if (side_diamonds_count) {
        const count = parseInt(side_diamonds_count, 10);
        if (!isNaN(count)) {
            matchStage.prodmeta_side_diamonds_count = { $gt: count };
        }
    }



    // Initialize the pipeline
    const pipeline = [];

    // Add the match stage to the pipeline
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Add the projection stage to create metal variants
    pipeline.push({
        $project: {
            prod_sku: 1,
            prod_Live_URL: 1,
            prod_long_desc: 1,
            prod_name: 1,
            prod_subcategory: 1,
            prod_type: 1,
            prodmeta_section: 1,
            prodmeta_ship_days: 1,
            prodmeta_side_diamonds_count: 1,
            metal_variants: [
                {
                    metal_type: "14k",
                    metal_available: "$attr_14k_metal_available",
                    price: {
                        $cond: { if: { $ne: ["$attr_14k_regular", ""] }, then: "$attr_14k_regular", else: null }
                    },
                    image: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: "$attr_14k_metal_available", regex: /white gold/i } },
                                    then: "$white_gold_img"
                                },
                                {
                                    case: { $regexMatch: { input: "$attr_14k_metal_available", regex: /rose gold/i } },
                                    then: "$rose_gold_img"
                                },
                                {
                                    case: { $regexMatch: { input: "$attr_14k_metal_available", regex: /yellow gold/i } },
                                    then: "$gold_img"
                                }
                            ],
                            default: "$white_gold_img" // Default image if no match
                        }
                    }
                },
                {
                    metal_type: "18k",
                    metal_available: "$attr_18k_metal_available",
                    price: {
                        $cond: { if: { $ne: ["$attr_18k_regular", ""] }, then: "$attr_18k_regular", else: null }
                    },
                    image: {
                        $switch: {
                            branches: [
                                {
                                    case: { $regexMatch: { input: "$attr_18k_metal_available", regex: /white gold/i } },
                                    then: "$white_gold_img"
                                },
                                {
                                    case: { $regexMatch: { input: "$attr_18k_metal_available", regex: /rose gold/i } },
                                    then: "$rose_gold_img"
                                },
                                {
                                    case: { $regexMatch: { input: "$attr_18k_metal_available", regex: /yellow gold/i } },
                                    then: "$gold_img"
                                }
                            ],
                            default: "$white_gold_img" // Default image if no match
                        }
                    }
                },
                {
                    metal_type: "platinum",
                    metal_available: "Platinum",
                    price: {
                        $cond: { if: { $ne: ["$attr_platinum_regular", ""] }, then: "$attr_platinum_regular", else: null }
                    },
                    image: "$platinum_img"
                }
            ]
        }
    });

    // Unwind metal_variants to split them into separate documents
    pipeline.push({ $unwind: "$metal_variants" });

    // Filter based on the metal_type query parameter and ensure price is not null
    const priceMatchStage = {
        "metal_variants.price": { $ne: null } // Ensure that price is not null
    };

    if (metal_type) {
        priceMatchStage["metal_variants.metal_type"] = metal_type.toLowerCase();
    }

    // Add the price range filter
    if (min_price || max_price) {
        priceMatchStage["metal_variants.price"] = {};
        if (min_price) {
            priceMatchStage["metal_variants.price"].$gte = parseFloat(min_price);
        }
        if (max_price) {
            priceMatchStage["metal_variants.price"].$lte = parseFloat(max_price);
        }
    }

    pipeline.push({
        $match: priceMatchStage
    });


    // Final projection to return only the necessary fields
    pipeline.push({
        $project: {
            prod_sku: 1,
            prod_long_desc: 1,
            prod_name: 1,
            prod_subcategory: 1,
            prod_type: 1,
            prodmeta_section: 1,
            prodmeta_ship_days: 1,
            prodmeta_side_diamonds_count: 1,
            metal_type: "$metal_variants.metal_type",
            metal_available: "$metal_variants.metal_available",
            price: "$metal_variants.price",
            image: "$metal_variants.image"
        }
    });
    //sorting
    if (sort_by === 'low') {
        pipeline.push({ $sort: { "price": 1 } });
    } else if (sort_by === 'high') {
        pipeline.push({ $sort: { "price": -1 } });
    }


    try {
        // Step 1: Get the total filtered count
        const filteredCountResult = await Product.aggregate([...pipeline, { $count: "count" }]);
        console.log(filteredCountResult, "result")
        const totalFilteredProducts = filteredCountResult[0] ? filteredCountResult[0].count : 0;

        // Step 2: Apply pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skipNum = (pageNum - 1) * limitNum;

        pipeline.push({ $skip: skipNum });
        pipeline.push({ $limit: limitNum });

        // Step 3: Fetch paginated products
        const products = await Product.aggregate(pipeline);

        // Calculate the remaining products after the current page
        const remainingProducts = totalFilteredProducts - (pageNum * limitNum);

        res.status(200).json({
            total: totalFilteredProducts,
            remainingProducts: remainingProducts > 0 ? remainingProducts : 0,
            products
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products from the database' });
    }
};


exports.deleteProducts = (async (req, res) => {
    try {

        const result = await Product.deleteMany({});


        res.status(200).json({
            message: 'All products deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        // Send an error response if something goes wrong
        res.status(500).json({ error: 'Failed to delete products' });
    }
})