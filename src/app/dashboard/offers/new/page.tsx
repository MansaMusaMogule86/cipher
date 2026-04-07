"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [whopLink, setWhopLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      setLoading(false);
      return;
    }

    if (whopLink.trim() && !/^https?:\/\/.+/.test(whopLink.trim())) {
      setError("Whop link must be a valid URL starting with https://");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("offers")
      .insert([
        {
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          price_label: priceLabel.trim() || null,
          whop_link: whopLink.trim() || null,
          status: "published",
        },
      ])
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data?.id) {
      setError("Offer was created but no ID was returned. Please check your dashboard.");
      setLoading(false);
      return;
    }

    router.push(`/offer/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto bg-neutral-900 p-6 rounded-xl">
        <h1 className="text-2xl mb-6">Create Offer</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Title"
            required
            className="w-full p-2 bg-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="w-full p-2 bg-neutral-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            placeholder="$49"
            className="w-full p-2 bg-neutral-800"
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
          />

          <input
            placeholder="https://whop.com/... (optional)"
            className="w-full p-2 bg-neutral-800"
            value={whopLink}
            onChange={(e) => setWhopLink(e.target.value)}
          />

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white text-black py-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Offer"}
          </button>
        </form>
      </div>
    </div>
  );
}