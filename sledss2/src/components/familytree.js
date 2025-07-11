import React, { useState, useRef } from "react";
import axios from "axios";
import config from './config';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import FamilyNode from "./FamilyNode";

const nodeTypes = { familyNode: FamilyNode };

const FamilyTreeGenerator = () => {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audio, setAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [treeGenerated, setTreeGenerated] = useState(false);

  const audioRef = useRef();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);
    setStory("");
    setAudioUrl(null);
    setPlaying(false);
    setTreeGenerated(false);

    let timer = setInterval(() => setProgress((prev) => Math.min(prev + 5, 95)), 500);

    try {
      const res = await axios.post(`${config.backendUrl}/api/family-historian`);
      setStory(res.data.story);
      const apiRes = await axios.get("http://f7c37c494f5816817.temporary.link:5002/api/aggregate", {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NTVhNTc5Zi0xYjA3LTQyMDQtYWM1OS0xMmFjM2YyOTRlMzAiLCJpYXQiOjE3NTE3OTc5MjksImV4cCI6MTc1Njk4MTkyOX0.mfipI1D0B2m5Drbw5eiJ2Hqfzx9qomQxhaXzflop-HU",
        },
      });

      const user = apiRes.data.user;
      const members = apiRes.data.familyCircles?.[0]?.members || [];
      const { nodes, edges } = buildTree(user, members);
      setNodes(nodes);
      setEdges(edges);
      setTreeGenerated(true);
      setProgress(100);
    } catch (err) {
      setStory("❌ Failed to load family history.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const buildTree = (user, members) => {
    const nodesData = [];
    const edgesData = [];
    const grouped = { parent: [], sibling: [], child: [], spouse: [] };

    members.forEach((m, i) => {
      const id = `${m.firstname}-${m.lastname}-${i}`;
      grouped[m.relationship]?.push({ ...m, id });
    });

    const userId = "owner";
    const spouse = grouped.spouse[0];

    grouped.parent.forEach((parent, i) => {
      nodesData.push({
        id: parent.id,
        type: "familyNode",
        data: {
          label: `${parent.firstname} ${parent.lastname}`,
          image: parent.profileImageUrl,
          title: "Parent",
          color: "#6f42c1",
        },
        position: { x: 200 + i * 200, y: 50 },
      });
      edgesData.push({ id: `e-parent-${parent.id}-${userId}`, source: parent.id, target: userId });
    });

    nodesData.push({
      id: userId,
      type: "familyNode",
      data: {
        label: `${user.firstname} ${user.lastname}`,
        image: user.profileImageUrl,
        title: "Owner",
        color: "#ff6f61",
      },
      position: { x: 400, y: 200 },
    });

    if (spouse) {
      nodesData.push({
        id: spouse.id,
        type: "familyNode",
        data: {
          label: `${spouse.firstname} ${spouse.lastname}`,
          image: spouse.profileImageUrl,
          title: "Spouse",
          color: "#20c997",
        },
        position: { x: 600, y: 200 },
      });
      edgesData.push({ id: `e-spouse-${spouse.id}-${userId}`, source: spouse.id, target: userId });
    }

    grouped.child.forEach((child, i) => {
      nodesData.push({
        id: child.id,
        type: "familyNode",
        data: {
          label: `${child.firstname} ${child.lastname}`,
          image: child.profileImageUrl,
          title: "Child",
          color: "#007bff",
        },
        position: { x: 300 + i * 200, y: 350 },
      });
      edgesData.push({ id: `e-child-${userId}-${child.id}`, source: userId, target: child.id });
      if (spouse) {
        edgesData.push({
          id: `e-child-${spouse.id}-${child.id}`,
          source: spouse.id,
          target: child.id,
          style: { stroke: "#999", strokeDasharray: "5 5" },
        });
      }
    });

    grouped.sibling.forEach((sibling, i) => {
      nodesData.push({
        id: sibling.id,
        type: "familyNode",
        data: {
          label: `${sibling.firstname} ${sibling.lastname}`,
          image: sibling.profileImageUrl,
          title: "Sibling",
          color: "#17a2b8",
        },
        position: { x: 100 + i * 200, y: 200 },
      });
      edgesData.push({
        id: `e-sibling-${userId}-${sibling.id}`,
        source: sibling.id,
        target: userId,
        style: { stroke: "#888" },
      });
    });

    return { nodes: nodesData, edges: edgesData };
  };

  const handlePlayPause = async () => {
    if (!audioUrl) {
      const res = await axios.post(
        `${config.backendUrl}/api/family-narration`,
        { story },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      setAudioUrl(url);
      const newAudio = new Audio(url);
      newAudio.onended = () => setPlaying(false);
      setAudio(newAudio);
      newAudio.play();
      setPlaying(true);
    } else {
      if (playing) audio.pause();
      else audio.play();
      setPlaying(!playing);
    }
  };

  const filteredNodes = nodes.map((node) => {
    const isMatch = node.data.label.toLowerCase().includes(searchTerm.toLowerCase());
    return {
      ...node,
      style: {
        background: isMatch ? "#fff2b2" : "white",
        border: isMatch ? "3px solid orange" : "1px solid #ccc",
      },
    };
  });

  return (
    <div style={{ padding: "2rem", display: "grid", gap: "2rem", gridTemplateRows: "auto auto auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#6b4c2d",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
          }}
        >
          {loading ? `⏳ Generating... ${progress}%` : "📂 Generate Family History"}
        </button>

        {treeGenerated && (
          <input
            type="text"
            placeholder="🔍 Search name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #aaa",
              background: "#fefefe",
            }}
          />
        )}
      </div>

      <ReactFlowProvider>
        <div style={{ height: "60vh", background: "#f4f7fa", borderRadius: 12, overflow: "hidden" }}>
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            panOnScroll
            zoomOnScroll
            defaultZoom={1}
          >
            <MiniMap />
            <Controls />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>

      {story && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ color: "#6b4c2d" }}>📜 Family Story</h2>
          <div style={{ background: "#fffbe6", padding: 15, borderRadius: 10 }}>{story}</div>

          <button
            onClick={handlePlayPause}
            style={{
              padding: "10px 16px",
              background: playing ? "#d9534f" : "#5cb85c",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            {playing ? "⏸ Pause Narration" : "🔊 Play Narration"}
          </button>

          {audioUrl && (
            <audio ref={audioRef} controls style={{ width: "100%" }} src={audioUrl}>
              Your browser does not support audio.
            </audio>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyTreeGenerator;