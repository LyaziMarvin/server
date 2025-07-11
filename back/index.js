const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const neo4j = require('neo4j-driver');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');  // <-- import uuid v4
const OpenAI = require('openai');
const { Readable } = require('stream');
let clients = [];

const SECRET_KEY = '1234';

const app = express();
app.use(cors());
app.use(express.json());


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NTVhNTc5Zi0xYjA3LTQyMDQtYWM1OS0xMmFjM2YyOTRlMzAiLCJpYXQiOjE3NTE3OTc5MjksImV4cCI6MTc1Njk4MTkyOX0.mfipI1D0B2m5Drbw5eiJ2Hqfzx9qomQxhaXzflop-HU"; // Truncated for security
const FAMILY_API = "http://f7c37c494f5816817.temporary.link:5002/api/aggregate";


const driver = neo4j.driver(
  'neo4j://184.168.29.119:7687',
  neo4j.auth.basic('neo4j', 'ooglobeneo4j')
);

// ✅ Updated Register CareUser
// 📥 Updated Register CareUser with relatives + importantDates
app.post('/api/register', async (req, res) => {
  const {
    email,
    preferredName,
    language,
    age,
    country,
    relatives,      // [{ name, relationship }]
    importantDates  // [{ date, label, relationship }]
  } = req.body;

  if (!email || !preferredName || !language || !age || !country || !relatives || !importantDates) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const session = driver.session();
  try {
    const userID = uuidv4();

    // Create CareUser
    await session.run(
      `
      CREATE (u:CareUser {
        userID: $userID,
        email: $email,
        preferredName: $preferredName,
        language: $language,
        age: toInteger($age),
        country: $country
      })
      `,
      {
        userID,
        email,
        preferredName,
        language,
        age,
        country
      }
    );

    // Create relatives
    for (const rel of relatives) {
      await session.run(
        `
        MATCH (u:CareUser {userID: $userID})
        CREATE (r:Relative {
          name: $name,
          relationship: $relationship
        })
        MERGE (u)-[:HAS_RELATIVE]->(r)
        `,
        {
          userID,
          name: rel.name,
          relationship: rel.relationship
        }
      );
    }

    // Create important dates
    for (const date of importantDates) {
      await session.run(
        `
        MATCH (u:CareUser {userID: $userID})
        CREATE (d:ImportantDate {
          date: $date,
          label: $label,
          relationship: $relationship
        })
        MERGE (u)-[:HAS_DATE]->(d)
        `,
        {
          userID,
          date: date.date,
          label: date.label,
          relationship: date.relationship
        }
      );
    }

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
});


// ✅ Updated Login CareUser
app.post('/api/login', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:CareUser {email: $email}) RETURN u.userID AS userID`,
      { email }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userID = result.records[0].get('userID');
    const token = jwt.sign({ userID }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token, userID });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
}); 


// === SUPER AGENT ENDPOINT ===

// === 1) SUPER AGENT ===
// Orchestrates child agents + tools + knowledge base + output
// -----------------------------------------------------------------------------

app.post('/api/agent', async (req, res) => {
  const { userID, message } = req.body;
  if (!userID || !message) {
    return res.status(400).json({ error: 'userID and message required' });
  }
  try {
    const resultText = await queryAgent(userID, message);
    res.json({ response: resultText });
  } catch (error) {
    console.error('❌ Super Agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// -----------------------------------------------------------------------------
// === 2) CHILD AGENT: Query Agent ===
// Handles CareUser database queries
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// === 2) CHILD AGENT: Query Agent ===
// Handles CareUser database queries
// -----------------------------------------------------------------------------

async function queryAgent(userID, message) {
  const session = driver.session();
  try {
    const lowerMessage = message.toLowerCase();

    // try to infer the user’s intent in a more general way
    const entity = detectEntity(lowerMessage);

    switch (entity.type) {
      case 'friend':
        return await handleFriends(session, userID);
      case 'relative':
        return await handleRelatives(session, userID, entity.subtype);
      case 'date':
        return await handleImportantDates(session, userID);
      case 'profile':
        return await handleProfileField(session, userID, entity.field, entity.suffix);
      default:
        return `❌ Sorry, I tried but could not recognize what you wanted to know.`;
    }
  } finally {
    await session.close();
  }
}


function detectEntity(text) {
  const fieldMappings = {
    age: ["age", "old"],
    country: ["country", "live", "reside", "stay"],
    language: ["language", "speak"],
    preferredName: ["name", "called"]
  };

  for (const [field, keywords] of Object.entries(fieldMappings)) {
    if (keywords.some(k => text.includes(k))) {
      let suffix = "";
      if (field === "age") suffix = "years old";
      // language, country, preferredName do not need a suffix
      return { type: "profile", field, suffix };
    }
  }


  if (["date", "birthday", "anniversary", "important"].some(k => text.includes(k))) {
    return { type: "date" };
  }

  if (text.includes("friend")) {
    return { type: "friend" };
  }

  // check for any known relatives
  const knownRelatives = [
    "cousin", "brother", "sister", "uncle", "aunt", "father", "mother", "parent",
    "grandparent", "grandmother", "grandfather"
  ];

  for (const rel of knownRelatives) {
    if (text.includes(rel)) {
      return { type: "relative", subtype: rel };
    }
  }

  // if user says something like “my relatives”
  if (text.includes("relative") || text.includes("family")) {
    return { type: "relative", subtype: null };
  }

  // default fallback
  return { type: "unknown" };
}


// === TOOLS for Query Agent ===
async function handleRelatives(session, userID, subtype = null) {
  if (subtype) {
    // fetch relatives of a specific type
    const result = await session.run(
      `MATCH (u:CareUser {userID: $userID})-[:HAS_RELATIVE]->(r:Relative)
       WHERE toLower(r.relationship) = toLower($subtype)
       RETURN r.name AS name`,
      { userID, subtype }
    );
    if (result.records.length === 0) return `✅ You have no ${subtype}s saved.`;
    const names = result.records.map(r => r.get('name'));
    return `✅ Your ${subtype}s: ${names.join(', ')}`;
  }

  // generic relatives
  const result = await session.run(
    `MATCH (u:CareUser {userID: $userID})-[:HAS_RELATIVE]->(r:Relative)
     RETURN r.name AS name, r.relationship AS relationship`,
    { userID }
  );
  if (result.records.length === 0) return `✅ You have no relatives saved.`;
  const formatted = result.records.map(r => `${r.get('name')} (${r.get('relationship')})`);
  return `✅ Your relatives:\n${formatted.join('\n')}`;
}


async function handleFriends(session, userID) {
  const result = await session.run(
    `MATCH (u:CareUser {userID: $userID})-[:HAS_FRIEND]->(f:Friend)
     RETURN f.name AS name`,
    { userID }
  );
  if (result.records.length === 0) return `✅ You have no friends saved.`;
  const names = result.records.map(r => r.get('name'));
  return `✅ Your friends: ${names.join(', ')}`;
}



async function handleWhoIs(session, userID, message) {
  const nameMatch = message.match(/who is (\w+)/i);
  if (!nameMatch) return `❌ I couldn't find a name in your question.`;
  const name = nameMatch[1];

  const result = await session.run(
    `
      MATCH (u:CareUser {userID: $userID})-[:HAS_RELATIVE]->(r:Relative)
      WHERE toLower(r.name) = toLower($name)
      RETURN r.relationship AS relationship
    `,
    { userID, name }
  );

  if (result.records.length === 0) return `❌ I couldn't find ${name} in your relatives.`;
  const relationship = result.records[0].get('relationship');
  return `✅ ${name} is your ${relationship.toLowerCase()}.`;
}




async function handleImportantDates(session, userID) {
  const result = await session.run(
    `MATCH (u:CareUser {userID: $userID})-[:HAS_DATE]->(d:ImportantDate)
     RETURN d.date AS date, d.label AS label, d.relationship AS relationship`,
    { userID }
  );
  if (result.records.length === 0) return `✅ You have no important dates saved.`;
  const formatted = result.records.map(r => {
    const date = r.get('date');
    const label = r.get('label');
    const rel = r.get('relationship');
    return `${label} (${rel}) on ${date}`;
  });
  return `✅ Your important dates:\n${formatted.join('\n')}`;
}

async function handleProfileField(session, userID, field, suffix = "") {
  const result = await session.run(
    `MATCH (u:CareUser {userID: $userID}) RETURN u.${field} AS value`,
    { userID }
  );
  const value = result.records[0].get('value');
  if (!value) return `❌ I couldn't find your ${field}.`;
  if (field === "preferredName") {
    return `✅ Your preferred name is ${value}.`;
  } else if (field === "language") {
    return `✅ You speak ${value}.`;
  } else if (field === "country") {
    return `✅ You live in ${value}.`;
  } else if (field === "age") {
    return `✅ You are ${value} ${suffix}.`;
  } else {
    return `✅ Your ${field} is ${value}.`;
  }
}



// === Helpers ===




function containsAny(message, keywords) {
  return keywords.some(keyword => message.includes(keyword));
}


function isQueryRequest(message) {
  const patterns = [
    /how many/i,
    /who is/i,
    /list all my/i,
    /tell me all my/i,
    /important dates/i,
    /my age/i,
    /how old/i,
    /my country/i,
    /where do i live/i,
    /my language/i,
    /my name/i
  ];
  return patterns.some(p => p.test(message));
}


function singularize(word) {
  let base = word.toLowerCase();
  if (base.endsWith('ies')) {
    // e.g., "babies" -> "baby"
    base = base.slice(0, -3) + 'y';
  } else if (base.endsWith('s') && !base.endsWith('ss')) {
    // remove trailing 's' if not 'ss' (e.g., "daughters" -> "daughter")
    base = base.slice(0, -1);
  }
  return capitalize(base);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}


// -----------------------------------------------------------------------------
// === 3) CHILD AGENT: Notification Agent ===
// Sends reminders based on month/day each year
// -----------------------------------------------------------------------------

// === Notification Stream Endpoint ===
app.get('/api/notifications/:userID', (req, res) => {
  const { userID } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = {
    userID,
    res,
    sentDates: new Set() // MM-DD keys
  };
  clients.push(client);

  req.on('close', () => {
    clients = clients.filter(c => c !== client);
  });
});

// === Notification Background Checker ===
setInterval(async () => {
  const session = driver.session();
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await session.run(`
      MATCH (u:CareUser)-[:HAS_DATE]->(d:ImportantDate)
      RETURN u.userID AS userID, d.date AS date, d.label AS label, d.relationship AS relationship
    `);

    for (const record of result.records) {
      const userID = record.get('userID');
      const originalDateStr = record.get('date');
      const label = record.get('label');
      const relationship = record.get('relationship');

      const originalDate = new Date(originalDateStr);
      const month = originalDate.getMonth();
      const day = originalDate.getDate();

      const thisYearDate = new Date(now.getFullYear(), month, day);
      thisYearDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round((thisYearDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 3) {
        const usaDate = `${(thisYearDate.getMonth() + 1).toString().padStart(2, '0')}/` +
                        `${thisYearDate.getDate().toString().padStart(2, '0')}/` +
                        `${thisYearDate.getFullYear()}`;

        const dayOfWeek = thisYearDate.toLocaleDateString('en-US', { weekday: 'long' });

        let message = '';
        if (diffDays === 0) {
          message = ` Reminder: ${label} (${relationship}) is TODAY (${dayOfWeek}, ${usaDate}).`;
        } else if (diffDays === 1) {
          message = ` Reminder: ${label} (${relationship}) is TOMORROW (${dayOfWeek}, ${usaDate}).`;
        } else {
          message = ` Reminder: ${label} (${relationship}) is on ${dayOfWeek}, ${usaDate}.`;
        }

        const dateKey = `${month + 1}-${day}`;
        clients
          .filter(c => c.userID === userID && !c.sentDates.has(dateKey))
          .forEach(c => {
            c.res.write(`data: ${JSON.stringify({ message })}\n\n`);
            c.sentDates.add(dateKey);
          });
      }
    }
  } catch (err) {
    console.error('Error checking reminders:', err);
  } finally {
    await session.close();
  }
}, 30_000);


app.post('/api/openai', async (req, res) => {
  const { mode, userID } = req.body;

  if (!mode || !userID) {
    return res.status(400).json({ error: 'Mode and userID required' });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:CareUser {userID: $userID}) RETURN u.country AS country, u.language AS language`,
      { userID }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const country = result.records[0].get('country');
    const language = result.records[0].get('language');

    let prompt = '';
    if (mode === 'translated-community-groups') {
      prompt = `You are a community advisor for elderly people. Based on your knowledge of ${country}, list 3–5 trusted community groups or local gatherings suitable for elderly individuals. For each group, provide:

1. The name of the group.
2. The exact location (including city, district, or neighborhood if available).
3. A brief sentence about what the group offers or does.
4. If available, provide the official website or online contact link.

Present the response in ${language} using warm, supportive, and clear language. Use a numbered list format.`;
    } else if (mode === 'english-community-groups') {
      prompt = `You are a community advisor for elderly people. Based on your knowledge of ${country}, list 3–5 welcoming and helpful community groups for older adults. For each group, include:

1. The name of the group.
2. The specific location (city, town, or neighborhood).
3. A brief description of what the group does (e.g., singing, walking, volunteering).
4. A website URL if available.

Use warm and clear English. Present the groups as a numbered list.`;
    } else if (mode === 'uplifting-message') {
      prompt = `You are a friendly elderly wellness agent. Write a heartwarming and uplifting message for an older adult to brighten their day. The tone should be warm, caring, and gentle. Respond in ${language}.`;
    } else {
      return res.status(400).json({ error: 'Invalid mode provided' });
    }

    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful and culturally sensitive assistant for elderly care.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    });

    const reply = aiRes.choices[0]?.message?.content;
    res.json({ response: reply });
  } catch (error) {
    console.error('Community AI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
});

// === Generate Family Story ===
app.post("/api/family-historian", async (req, res) => {
  try {
    const apiRes = await axios.get(FAMILY_API, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const { user, familyCircles } = apiRes.data;
    const members = familyCircles?.[0]?.members || [];

    console.log("=== FAMILY CIRCLE API RESPONSE ===");
    console.log(JSON.stringify(apiRes.data, null, 2));

    // Format data for prompt
    const owner = `
Full Name: ${user.firstname} ${user.lastname}
Gender: ${user.gender}
Birthday: ${user.birthday}
Location: ${user.location}
Email: ${user.email}
Phone Number: ${user.phoneNumber}
`;

    const memberDetails = members.map((m, i) =>
      `${i + 1}. ${m.firstname} ${m.lastname} — Relationship: ${m.relationship}, Email: ${m.email}`
    ).join("\n");

    const prompt = `
You are a factual and empathetic family historian. Based only on the data below, write a short, warm, narrative-style family history. 
Do not add any information that is not included. No fictional names, events, or locations. Stay strictly within the data.

=== FAMILY CIRCLE OWNER ===
${owner}

=== FAMILY MEMBERS ===
${memberDetails}

Use the tone of a historian reflecting warmly on the real family of ${user.firstname} ${user.lastname}, while only referencing the provided people and details.
`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful family historian AI. Do not hallucinate. Use only the data given.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const story = aiRes.choices?.[0]?.message?.content || "No story generated.";
    res.json({ story });

  } catch (error) {
    console.error("❌ Error generating family story:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


// === Narrate Family Story ===
app.post("/api/family-narration", async (req, res) => {
  const { story } = req.body;
  if (!story) return res.status(400).json({ error: "Story is required" });

  try {
    const speechRes = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: story,
    });

    const buffer = Buffer.from(await speechRes.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=story.mp3");
    Readable.from(buffer).pipe(res);
  } catch (err) {
    console.error("❌ Narration error:", err.message);
    res.status(500).json({ error: "Narration generation failed" });
  }
});




// 🚀 Start server on port 5009
const PORT = 5009;
app.listen(PORT, () => {
  console.log(`Agent backend running on port ${PORT}`);
});


