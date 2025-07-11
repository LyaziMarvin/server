import React from "react";
import { Handle, Position } from "reactflow";

const FamilyNode = ({ data }) => {
  const { label, image, title, color } = data;

  return (
    <div
      style={{
        textAlign: "center",
        border: `2px solid ${color || "#ccc"}`,
        borderRadius: "10px",
        background: "white",
        padding: "10px",
        width: "140px",
        boxShadow: `0 2px 5px ${color || "rgba(0,0,0,0.1)"}`,
      }}
    >
      <img
        src={image}
        alt={label}
        style={{
          width: "80px",
          height: "80px",
          objectFit: "cover",
          borderRadius: "50%",
          marginBottom: "5px",
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/80";
        }}
      />
      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{label}</div>
      {title && <div style={{ fontSize: "12px", color: "#555" }}>{title}</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default FamilyNode;


