import { Fetch } from "sode-extend-react";
import BasicRest from "./BasicRest";

class ItemsPresetRest extends BasicRest {
    path = "item-presets";

    dataAlbum = async (request) => {
        try {
            const { status, result } = await Fetch(
                `/api/${this.path}`,
                {
                    method: "POST",
                    body: JSON.stringify(request),
                }
            );
            if (!status)
                throw new Error(
                    result?.message ??
                        "Ocurrió un error al consultar el stock de los productos"
                );
            return result.data ?? [];
        } catch (error) {
            return [];
        }
    };
  
    

    
}

export default ItemsPresetRest;
