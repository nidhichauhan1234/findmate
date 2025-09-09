import React, { useState } from "react";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();

export default function EditProfile({ profile, onClose, onProfileUpdate }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    name: profile.name || "",
    branch: profile.branch || "",
    email: profile.email || "",
    batch: profile.batch || "",
    college: profile.college || "",
    skills: profile.skills ? profile.skills.join(", ") : ""
  });

  const [error, setError] = useState("");

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validation: all fields mandatory
    for (const key of ["name", "branch", "email", "batch", "college", "skills"]) {
      if (!form[key] || form[key].trim() === "") {
        setError(`Field ${key} is required`);
        return;
      }
    }

    // Prepare skills array from comma-separated string
    const skillsArray = form.skills.split(",").map(s => s.trim()).filter(s => s !== "");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: form.name,
        branch: form.branch,
        email: form.email,
        batch: form.batch,
        college: form.college,
        skills: skillsArray
      });
      onProfileUpdate({
        ...profile,
        ...form,
        skills: skillsArray
      });
      onClose();
    } catch (err) {
      setError("Failed to update profile. Try again.");
    }
  };

  return (
    <div className="edit-profile-modal-backdrop">
      <div className="edit-profile-modal">
        <h2>Edit Profile</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <label>Name*
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>Branch*
            <input name="branch" value={form.branch} onChange={handleChange} />
          </label>
          <label>Email*
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label>Batch*
            <input name="batch" value={form.batch} onChange={handleChange} />
          </label>
          <label>College*
            <input name="college" value={form.college} onChange={handleChange} />
          </label>
          <label>Skills* (comma separated)
            <input name="skills" value={form.skills} onChange={handleChange} />
          </label>
          <div className="edit-profile-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
