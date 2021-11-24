import express from "express";
import cors from "cors";
import { Not, In } from "typeorm";
import { getConfigFile } from "medusa-core-utils";

const { Router } = express;

export default (rootDirectory) => {
    const config = getConfigFile(rootDirectory, "medusa-config").configModule.projectConfig;
    const router = Router();

    const corsOptions = {
        origin: config.store_cors.split(","),
        credentials: true,
    };

    app.options("/store/carts/:id/related", cors(corsOptions)); 

    router.get("/store/carts/:id/related", async (req, res) => {
        const cartService = req.scope.resolve("cartService");
        const productService = req.scope.resolve("productService");

        const cart = await cartService.retrieve(req.params.id, {
            relations: ["items", "items.variant", "items.variant.product"],
        });
        if (cart.items.length > 0) {
            let tags = [];
            let ids = [];
            for (let item of cart.items) {
                let res = await productService.retrieve(item.variant.product.id, {
                    relations: ["tags"],
                });
                ids.push(res.id);
                tags.push(res.tags);
            }
            tags = tags.flat();
            tags = tags.map((tag) => tag.id);

            let result = await productService.list(
                {
                    tags,
                    id: Not(In(ids)),
                },
                {
                    relations: [
                        "variants",
                        "variants.prices",
                        "options",
                        "options.values",
                        "images",
                        "tags",
                        "collection",
                        "type",
                    ],
                    take: config.relatedAmount || 3,
                }
            );
            res.status(200).json(result);
        } else {
            res.status(200).json([]);
        }
    });
    return router;
};
