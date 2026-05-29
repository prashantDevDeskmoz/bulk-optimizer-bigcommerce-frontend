
const templateCache = new Map<string, string>();

export const getProductTemplateCache = (tab: string, channelId: string, type: "template" | "cruiseControl") => {
    const key = `product:${tab}:${channelId}:${type}`;
    return templateCache.get(key); 
}

export const setProductTemplateCache = (tab: string, channelId: string, value: string, type: "template" | "cruiseControl") => {
    const key = `product:${tab}:${channelId}:${type}`;
    templateCache.set(key, value);
};

export const getCategoryTemplateCache = (tab: string, channelId: string, type: "template" | "cruiseControl") => {
    const key = `category:${tab}:${channelId}:${type}`;
    return templateCache.get(key);
};

export const setCategoryTemplateCache = (tab: string, channelId: string, value: string, type: "template" | "cruiseControl") => {
    const key = `category:${tab}:${channelId}:${type}`;
    templateCache.set(key, value);
};

export const getBrandTemplateCache = (tab: string) => {
    const key = `brand:${tab}`;
    return templateCache.get(key);
};

export const setBrandTemplateCache = (tab: string, value: string) => {
    const key = `brand:${tab}`;
    templateCache.set(key, value);
};

export const getAllProductAndSaveTemplate = async (data: any) => {
    try {
        if(data && data.length > 0) {
            data.forEach((template: any) => {
                if(template.applyTo === "products") {
                    setProductTemplateCache(template.target, template.bcChannelId, template.template, "template");
                    setProductTemplateCache(template.target, template.bcChannelId, template.cruiseControl, "cruiseControl");
                } else if(template.applyTo === "categories") {
                    setCategoryTemplateCache(template.target, template.bcChannelId, template.template, "template");
                    setCategoryTemplateCache(template.target, template.bcChannelId, template.cruiseControl, "cruiseControl");
                } else if(template.applyTo === "brands") {
                    setBrandTemplateCache(template.target, template.template);
                }
            });
        }
    } catch (error) {
        {}
    }
};
