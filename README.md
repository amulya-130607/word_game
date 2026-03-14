<div align="center">

# 🏎️💨 NEON SPEEDSTER
**Survive the Grid. Outrun the Code.**

![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/Dependencies-NONE-success?style=for-the-badge)

*A pure Vanilla JS endless racer built for the browser. No engines, no packages—just raw canvas, math, and synthetic soundwaves.*

</div>

---

## 🌃 The Vibe

You're dropped into a high-speed pursuit on an endless, winding digital highway. The air is electric, the neon glows, and the mountains loom in the dark abyss below. Slower traffic clogs the passing lanes, and you've got one goal: **Don't crash.**


## ✨ Core Matrix Features

*   **🎮 Endless Procedural Generation**: The track curves algorithmically. The enemies spawn dynamically. The speed scales ruthlessly.
*   **🏔️ Pseudo-3D Parallax**: Feel the depth as the neon-lit road snakes through dark, looming silhouetted mountains.
*   **🎵 Procedural Sythwave Audio**: Who needs `.mp3` files? Every coin chime and crash distortion is synthesized raw in real-time using the `window.AudioContext` API.
*   **💰 Score Multipliers**: Weave through the grid traffic to collect shiny yellow digital coins for an instant score payload.
*   **💥 Particle Physics**: When you inevitably hit the bumper of a slow-moving pixelized sedan, watch your vehicle scatter into blazing neon particles.
*   **📱 Universal Handling**: Responsive layouts with Glassmorphism UI. Play with arrow keys on desktop or swipe/drag to steer on mobile touchscreens.

---

<div align="center">

## 🕹️ HOW TO PLAY

**OBJECTIVE:** Stay alive. Collect the glowing orbs. Maximize your speed multiplier.

| Platform | Controls |
| :---: | :--- |
| **Desktop** | Use the `Left / Right Arrow Keys` or `A / D` to steer your rig. |
| **Mobile / Tablet** | Tap and drag anywhere on the screen to directly control your lane position. |

</div>

---

## 🚀 Ignition Sequence

You don't need a massive node_modules folder to run this game. It runs directly in the browser.

### The Quick Way (Direct Launch)
Double click `index.html`. Your browser will handle the rest.

### The Proper Way (For Audio Synthesis)
Modern browsers like to block audio from playing automatically for security reasons. To get the full auditory experience, run a tiny local server:

```bash
# Boot the grid emulator via Python:
python -m http.server 8000
```
Then jack in via your browser at: `http://localhost:8000`

---

## 📂 Architecture

A clean, dependency-free trifecta:
```text
/
├── index.html        # The Frame and UI Overlays (Orbitron & Rajdhani fonts)
├── css/
│   └── style.css     # The Paintjob: Box-shadows, glow filters, glassmorphism
└── js/
    └── game.js       # The Engine: Math equations, physics, rendering, audio waves
```

## 🤝 Hack the Mainframe

Got an idea to make the grid better? Power-ups? Lasers? A global high-score database? Fork the repo, mod the engine, and send a Pull Request!

---

<div align="center">
<i>"Speed has never killed anyone. Suddenly becoming stationary, that's what gets you."</i><br>
🏎️ 💨
</div>
