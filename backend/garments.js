// garments.js
// Single source of truth for garment reference images and Leffa garment types.
// Both server.js and scripts/verify-garments.js import from here so they
// can never drift out of sync.

export const GARMENT_IMAGES = {
  gala: "https://mirra-backend-b1c7.onrender.com/garments/gala.jpg",
  business: "https://mirra-backend-b1c7.onrender.com/garments/business.jpg",
  street: "https://mirra-backend-b1c7.onrender.com/garments/street.jpg",
  editorial: "https://mirra-backend-b1c7.onrender.com/garments/editorial.jpg",
  resort: "https://mirra-backend-b1c7.onrender.com/garments/resort.jpg",
  cocktail: "https://mirra-backend-b1c7.onrender.com/garments/cocktail.jpg",
  afrofusion: "https://mirra-backend-b1c7.onrender.com/garments/afrofusion.jpg",
  athleisure: "https://mirra-backend-b1c7.onrender.com/garments/athleisure.jpg",
  boho: "https://mirra-backend-b1c7.onrender.com/garments/boho.jpg",
  monochrome: "https://mirra-backend-b1c7.onrender.com/garments/monochrome.jpg",
  agbada: "https://mirra-backend-b1c7.onrender.com/garments/agbada.jpg",
  tuxedo: "https://mirra-backend-b1c7.onrender.com/garments/tuxedo.jpg",
  smartcasual: "https://mirra-backend-b1c7.onrender.com/garments/smartcasual.jpg",
  powersuit_m: "https://mirra-backend-b1c7.onrender.com/garments/powersuit_m.jpg",
  streetwear_m: "https://mirra-backend-b1c7.onrender.com/garments/streetwear_m.jpg",
  dashiki: "https://mirra-backend-b1c7.onrender.com/garments/dashiki.jpg",
  resort_m: "https://mirra-backend-b1c7.onrender.com/garments/resort_m.jpg",
  editorial_m: "https://mirra-backend-b1c7.onrender.com/garments/editorial_m.jpg",
  athleisure_m: "https://mirra-backend-b1c7.onrender.com/garments/athleisure_m.jpg",
  monochrome_m: "https://mirra-backend-b1c7.onrender.com/garments/monochrome_m.jpg",
};

// Leffa's vt_garment_type only accepts: "upper_body" | "lower_body" | "dresses"
export const GARMENT_TYPES = {
  gala: "dresses",
  business: "dresses",
  street: "upper_body",
  editorial: "dresses",
  resort: "dresses",
  cocktail: "dresses",
  afrofusion: "dresses",
  athleisure: "upper_body",
  boho: "dresses",
  monochrome: "dresses",
  agbada: "dresses",
  tuxedo: "dresses",
  smartcasual: "dresses",
  powersuit_m: "dresses",
  streetwear_m: "upper_body",
  dashiki: "upper_body",
  resort_m: "dresses",
  editorial_m: "dresses",
  athleisure_m: "upper_body",
  monochrome_m: "dresses",
};

export const ALL_OUTFIT_IDS = Object.keys(GARMENT_IMAGES);
