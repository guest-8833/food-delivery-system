// Add.jsx - Stock tracking removed

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Add.css";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import api from "../../services/api";

const CATEGORIES = ["Fasting", "Non-Fasting"];

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  price: "",
  category: "Fasting",
};

const Add = () => {
  const { t } = useTranslation();
  const [image, setImage] = useState(false);
  const [data, setData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryLabel = (category) =>
    category === "Fasting" ? t("add.categoryFasting") : t("add.categoryNonFasting");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!image) {
      toast.error(t("add.pleaseUploadImage"));
      return;
    }

    if (!data.name || !data.description || !data.price) {
      toast.error(t("add.pleaseFillAllFields"));
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("description", data.description.trim());
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("image", image);

    try {
      const response = await api.post("/api/food/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Add timeout to prevent hanging
        timeout: 30000,
      });

      if (response.data.success) {
        setData(INITIAL_FORM_STATE);
        setImage(false);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Add food error:", error);
      if (error.response?.status === 413) {
        toast.error(t("add.imageTooLarge"));
      } else {
        toast.error(error.response?.data?.message || t("add.addFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add">
      <form className="flex-col" onSubmit={handleSubmit}>
        <div className="add-img-upload flex-col">
          <p>{t("add.uploadImage")}</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt="Upload preview"
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="image"
            hidden
            required
            accept="image/*"
          />
        </div>

        <div className="add-product-name flex-col">
          <p>{t("add.productName")}</p>
          <input
            onChange={handleChange}
            value={data.name}
            type="text"
            name="name"
            placeholder={t("add.writeHere")}
            required
            maxLength="100"
          />
        </div>

        <div className="add-product-description flex-col">
          <p>{t("add.productDescription")}</p>
          <textarea
            onChange={handleChange}
            value={data.description}
            name="description"
            rows="6"
            placeholder={t("add.writeContentHere")}
            required
            maxLength="500"
          />
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>{t("add.category")}</p>
            <select
              onChange={handleChange}
              value={data.category}
              name="category"
              required
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div className="add-price flex-col">
            <p>{t("add.productPrice")}</p>
            <div className="price-input-wrapper">
              <span className="price-prefix">{t("common.etb")}</span>
              <input
                onChange={handleChange}
                value={data.price}
                type="number"
                name="price"
                placeholder="200"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="add-btn" disabled={isSubmitting}>
          {isSubmitting ? t("add.adding") : t("add.addProduct")}
        </button>
      </form>
    </div>
  );
};

export default Add;
