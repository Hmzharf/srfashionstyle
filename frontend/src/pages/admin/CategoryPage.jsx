import { useEffect, useState } from "react";
import api from "../../lib/axios";

function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Gagal ambil kategori", err.response?.data || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/categories", {
        name,
        is_active: true,
      });

      setName("");
      fetchCategories();
    } catch (err) {
      console.error("Gagal tambah kategori", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Manajemen Kategori</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nama kategori"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <button type="submit">Tambah</button>
      </form>

      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Slug</th>
            <th>Aktif</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.slug}</td>
              <td>{item.is_active ? "Ya" : "Tidak"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryPage;