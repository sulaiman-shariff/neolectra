"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Poppins } from "next/font/google";
import styles from "./page.module.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

// Solar equipment recommendations data tailored for Bangalore, India
const recommendations = {
  solarPanels: [
    {
      id: 1,
      name: "LOOM Solar Shark 455W (Mono PERC)",
      brand: "LOOM Solar",
      power: "455W",
      efficiency: "21.9%",
      warranty: "25 years",
      price: "₹10,000 (approx./unit)",
      rating: 4.6,
      features: ["Made in India", "High power-density", "Good low-light performance"],
      image: "/images/loom-shark-455.jpg",
      amazonLink: "https://www.loomsolar.com/collections/solar-panels"
    },
    {
      id: 2,
      name: "Vikram HYPERSOL 405W (N-type)",
      brand: "Vikram Solar",
      power: "405W",
      efficiency: "21.5%",
      warranty: "25 years",
      price: "₹12,375 (approx./unit)",
      rating: 4.7,
      features: ["N-type cells", "Bifacial options", "Strong Indian service network"],
      image: "/images/vikram-405.jpg",
      amazonLink: "https://www.amazon.in/s?k=Vikram+Solar+HYPERSOL+405W"
    },
    {
      id: 3,
      name: "WAAREE 450Wp 144-cell (Mono PERC)",
      brand: "Waaree",
      power: "450W",
      efficiency: "21.0%",
      warranty: "25 years",
      price: "₹8,599 (sale price on manufacturer site, approx.)",
      rating: 4.5,
      features: ["144-cell Half-cut", "Good value", "BIS & IEC certified"],
      image: "/images/waaree-450.jpg",
      amazonLink: "https://shop.waaree.com/waaree-450wp-144cells-24-volts-mono-perc-solar-module/"
    },
    {
      id: 4,
      name: "Adani Solar (Residential series 400–530W)",
      brand: "Adani Solar",
      power: "400–530W (various models)",
      efficiency: "20.8–21.8%",
      warranty: "25 years",
      price: "₹13,000 (typical / model-dependent)",
      rating: 4.6,
      features: ["Large Indian manufacturer", "TOPCon / MonoPERC options", "Strong warranty & supply chain"],
      image: "/images/adani-solar.jpg",
      amazonLink: "https://www.adanisolar.com/product"
    }
  ],
  inverters: [
    {
      id: 1,
      name: "Sungrow SG5.0 / SG5KTL (Single-phase, 5 kW)",
      brand: "Sungrow (India)",
      power: "5 kW",
      efficiency: "98%+",
      warranty: "5–10 years (model dependent)",
      price: "₹65,000 - ₹95,000 (approx., retail varies by dealer)",
      rating: 4.6,
      features: ["Residential string inverter", "Indian SG series", "Built-in monitoring compatible"],
      image: "/images/sungrow-5kw.jpg",
      amazonLink: "https://ind.sungrowpower.com/productDetail/2292/string-inverter-sg4-0-5-0-6-0rs-l"
    },
    {
      id: 2,
      name: "Growatt 5000 ES (Hybrid/Grid-tie)",
      brand: "Growatt",
      power: "5 kW",
      efficiency: "97%+",
      warranty: "5–10 years",
      price: "₹110,000 (approx. — dealer/wholesale reference)",
      rating: 4.5,
      features: ["Hybrid capability", "App monitoring", "Common in Indian rooftop installs"],
      image: "/images/growatt-5kw.jpg",
      amazonLink: "https://www.tradeindia.com/products/growatt-5kw-48v-spf-5000-es-inverter-c8769863.html"
    },
    {
      id: 3,
      name: "Luminous TX (5 kVA) Hybrid inverter",
      brand: "Luminous",
      power: "5 kVA",
      efficiency: "95%+",
      warranty: "5–10 years",
      price: "₹55,000 (approx. retail)",
      rating: 4.4,
      features: ["Hybrid inverter", "Local service & spares in Bangalore", "Good value for smaller homes"],
      image: "/images/luminous-tx-5k.jpg",
      amazonLink: "https://www.luminousindia.com/product/solar-hybrid-inverter-tx-5-kva"
    },
    {
      id: 4,
      name: "Fronius Primo (single-phase 5 kW)",
      brand: "Fronius",
      power: "5.0 kW",
      efficiency: "98%+",
      warranty: "5–10 years (extendable)",
      price: "₹4,03,000 (import list / distributor price - approx.)",
      rating: 4.8,
      features: ["Premium European build", "Excellent monitoring", "High reliability"],
      image: "/images/fronius-primo.jpg",
      amazonLink: "https://www.ubuy.co.in/product/15X3W430A-fronius-primo-5-1-phase-2-mppt-primo-5-0-1-solar-inverter"
    }
  ],
  batteries: [
    {
      id: 1,
      name: "Tata Power Solar — Home battery / integrated solutions",
      brand: "Tata Power Solar",
      capacity: "Modular (typical 3.5–10 kWh home configs)",
      power: "varies by system",
      warranty: "5–10 years (product dependent)",
      price: "₹70,000 - ₹1,50,000 (approx. by capacity & config)",
      rating: 4.5,
      features: ["Local support & installation", "Paired with Tata rooftop systems", "Turnkey solutions"],
      image: "/images/tatapower-battery.jpg",
      amazonLink: "https://www.tatapowersolar.com/rooftops/residential/"
    },
    {
      id: 2,
      name: "Luminous Li-ion Home ESS (residential lithium options)",
      brand: "Luminous",
      capacity: "3.5–10 kWh (model dependent)",
      power: "3–6 kW (depending on model)",
      warranty: "8–10 years (model dependent)",
      price: "₹75,000 - ₹1,25,000 (approx.)",
      rating: 4.4,
      features: ["Li-ion chemistry", "Modular", "Local service network"],
      image: "/images/luminous-ess.jpg",
      amazonLink: "https://www.luminousindia.com/"
    },
    {
      id: 3,
      name: "Exide Solar / Tubular Batteries (for off-grid / hybrid needs)",
      brand: "Exide",
      capacity: "2.4 kWh – 10 kWh (lead/tubular or larger ESS)",
      power: "varies",
      warranty: "3–7 years (model dependent)",
      price: "₹15,000 - ₹60,000 (lead/tubular) or higher for Li-ion packs",
      rating: 4.3,
      features: ["Well-known Indian brand", "Tubular options for solar", "Good local service"],
      image: "/images/exide-battery.jpg",
      amazonLink: "https://exidehome.exidecare.com/"
    },
    {
      id: 4,
      name: "Su-Kam / SuKAM Li-ion & tubular options (popular local choices)",
      brand: "Su-Kam",
      capacity: "2.4 kWh – 10 kWh (model dependent)",
      power: "varies",
      warranty: "3–7 years",
      price: "₹18,000 - ₹85,000 (approx. by model)",
      rating: 4.2,
      features: ["Long history in Indian backup market", "Multiple chemistry choices"],
      image: "/images/sukam-battery.jpg",
      amazonLink: "https://www.su-kam.com/"
    }
  ],
  accessories: [
    {
      id: 1,
      name: "IronRidge XR Rail (mounting rails & kits)",
      brand: "IronRidge",
      type: "Mounting Rails",
      warranty: "25 years (manufacturer support varies by distributor)",
      price: "₹6,000 - ₹15,000 / rail (imported/distributor pricing varies)",
      rating: 4.8,
      features: ["Strong structural performance", "Popular with rooftop installs", "Distributor network in India"],
      image: "/images/ironridge-rail.jpg",
      amazonLink: "https://www.ironridge.com/"
    },
    {
      id: 2,
      name: "Pre-wired MidNite / Combiner / E-Panel style boxes (local vendors)",
      brand: "Midnite / local",
      type: "Combiner Box",
      warranty: "3–5 years",
      price: "₹10,000 - ₹40,000 (depending on spec)",
      rating: 4.5,
      features: ["NEMA/ IP rated options", "Pre-wired for easy install", "Used in Indian installs"],
      image: "/images/midnite-epanel.jpg",
      amazonLink: "https://www.amazon.in/s?k=midnite+epanel"
    },
    {
      id: 3,
      name: "SolarEdge / Module-level power optimizers (P730 style) - import option",
      brand: "SolarEdge",
      type: "Power Optimizer",
      warranty: "25 years (model dependent)",
      price: "₹20,000 (import list price for P730 - approx.)",
      rating: 4.7,
      features: ["Panel-level MPPT", "Shade mitigation", "Module-level monitoring"],
      image: "/images/solaredge-optimizer.jpg",
      amazonLink: "https://www.ubuy.co.in/product/RSVLE096-solaredge-p730-for-2-x-high-power-72-cell-pv-modules"
    },
    {
      id: 4,
      name: "MC4 Solar Connectors (pairs)",
      brand: "Generic / Multi-Contact",
      type: "Connectors",
      warranty: "Varies",
      price: "₹399 (10 pairs) – typical Amazon listing",
      rating: 4.5,
      features: ["Weatherproof IP67", "Industry standard", "Cheap & widely available in Bangalore market"],
      image: "/images/mc4-connectors.jpg",
      amazonLink: "https://www.amazon.in/s?k=MC4+Connector"
    }
  ]
};

export default function SuggestionsPage() {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ));
  };

  const ProductCard = ({ product, category }: { product: any; category: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={styles.productCard}
    >
      <div className={styles.productImage}>
        <div className={styles.imagePlaceholder}>
          {/* Replace placeholder with real <img src={product.image} alt={product.name} /> in production */}
          📷
        </div>
      </div>
      
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productBrand}>{product.brand}</p>
        
        <div className={styles.productSpecs}>
          {product.power && <span>Power: {product.power}</span>}
          {product.capacity && <span>Capacity: {product.capacity}</span>}
          {product.efficiency && <span>Efficiency: {product.efficiency}</span>}
          {product.type && <span>Type: {product.type}</span>}
        </div>
        
        <div className={styles.productRating}>
          {renderStars(product.rating)}
          <span className={styles.ratingNumber}>({product.rating})</span>
        </div>
        
        <div className={styles.productFeatures}>
          {product.features.map((feature: string, index: number) => (
            <span key={index} className={styles.feature}>
              ✓ {feature}
            </span>
          ))}
        </div>
        
        <div className={styles.productFooter}>
          <div className={styles.price}>{product.price}</div>
          <div className={styles.warranty}>Warranty: {product.warranty}</div>
          <a 
            href={product.amazonLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.buyButton}
          >
            View Details
          </a>
        </div>
      </div>
    </motion.div>
  );

  return (
    <main className={`${poppins.className} ${styles.main}`}>
      {/* Header */}
      <section className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.backButton}>
            ← Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.headerContent}
          >
            <h1 className={styles.title}>
              Solar Equipment Recommendations — Bangalore (IN)
            </h1>
            <p className={styles.subtitle}>
              Curated selection of popular India-market solar panels, inverters, batteries and accessories — approximate Bangalore retail pricing shown.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solar Panels Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionTitle}
          >
            ☀️ Best Solar Panels (India)
          </motion.h2>
          
          <div className={styles.productsGrid}>
            {recommendations.solarPanels.map((panel) => (
              <ProductCard key={panel.id} product={panel} category="panels" />
            ))}
          </div>
        </div>
      </section>

      {/* Inverters Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionTitle}
          >
            ⚡ Top Inverters (India-ready)
          </motion.h2>
          
          <div className={styles.productsGrid}>
            {recommendations.inverters.map((inverter) => (
              <ProductCard key={inverter.id} product={inverter} category="inverters" />
            ))}
          </div>
        </div>
      </section>

      {/* Batteries Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionTitle}
          >
            🔋 Battery Storage (Indian options)
          </motion.h2>
          
          <div className={styles.productsGrid}>
            {recommendations.batteries.map((battery) => (
              <ProductCard key={battery.id} product={battery} category="batteries" />
            ))}
          </div>
        </div>
      </section>

      {/* Accessories Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionTitle}
          >
            🔧 Essential Accessories (India)
          </motion.h2>
          
          <div className={styles.productsGrid}>
            {recommendations.accessories.map((accessory) => (
              <ProductCard key={accessory.id} product={accessory} category="accessories" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.ctaContent}
          >
            <h2>Ready to Start Your Solar Journey in Bangalore?</h2>
            <p>For exact Bangalore pricing, rooftop layout checks, and government rebate guidance (if eligible), request a site survey — local dealers give accurate quotes including installation & taxes.</p>
            <Link href="/map" className={styles.ctaButton}>
              Plan Your Installation
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
