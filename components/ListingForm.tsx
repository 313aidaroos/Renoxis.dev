"use client";

import { useState } from "react";

export function ListingForm() {
  const [formData, setFormData] = useState({
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    lotSize: "",
    yearBuilt: "",
    propertyType: "Single Family",
    features: "",
    highlights: "",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/listings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const data = await response.json();
      setResult(data.listing);
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : "Failed to generate listing"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Address *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Price *</label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="$500,000"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Property Type</label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
            >
              <option>Single Family</option>
              <option>Condo</option>
              <option>Townhouse</option>
              <option>Multi-Family</option>
              <option>Land</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Beds</label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Baths</label>
            <input
              type="number"
              step="0.5"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Sq Ft</label>
            <input
              type="number"
              name="sqft"
              value={formData.sqft}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="2000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Lot Size</label>
            <input
              type="text"
              name="lotSize"
              value={formData.lotSize}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="0.25 acres"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Year Built</label>
            <input
              type="number"
              name="yearBuilt"
              value={formData.yearBuilt}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
              placeholder="2015"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Key Features (one per line)
          </label>
          <textarea
            name="features"
            value={formData.features}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
            placeholder="Granite countertops&#10;Hardwood floors&#10;Stainless steel appliances&#10;Two-car garage"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Neighborhood Highlights
          </label>
          <textarea
            name="highlights"
            value={formData.highlights}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-foreground"
            placeholder="Top-rated schools&#10;Shopping and dining nearby&#10;Parks and trails"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          {loading ? "Generating..." : "Generate listing copy"}
        </button>
      </form>

      <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Generated Listing Copy</h3>
        {result ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-zinc-50 dark:bg-zinc-900 p-4 rounded">
              {result}
            </pre>
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Fill out the form and click Generate to see your listing copy here.
          </p>
        )}
      </div>
    </div>
  );
}
