import React, { useState, useEffect } from "react";
import "./Css/CaptchaModal.css";

// ── Challenge pool ────────────────────────────────────────────────────────────
// Each challenge has a prompt and 9 tiles; correctIndices are 0-based positions
// that the user must click.
const CHALLENGES = [
    {
        prompt: "Select all images with a",
        subject: "Tricycle",
        tiles: [
            { label: "Tricycle", emoji: "🛺" },
            { label: "Car", emoji: "🚗" },
            { label: "Tricycle", emoji: "🛺" },
            { label: "Motorcycle", emoji: "🏍️" },
            { label: "Bus", emoji: "🚌" },
            { label: "Tricycle", emoji: "🛺" },
            { label: "Truck", emoji: "🚛" },
            { label: "Tricycle", emoji: "🛺" },
            { label: "Bicycle", emoji: "🚲" },
        ],
        correctIndices: [0, 2, 5, 7],
    },
    {
        prompt: "Select all images with a",
        subject: "Car",
        tiles: [
            { label: "Car", emoji: "🚗" },
            { label: "Tricycle", emoji: "🛺" },
            { label: "Motorcycle", emoji: "🏍️" },
            { label: "Car", emoji: "🚗" },
            { label: "Bus", emoji: "🚌" },
            { label: "Car", emoji: "🚗" },
            { label: "Bicycle", emoji: "🚲" },
            { label: "Truck", emoji: "🚛" },
            { label: "Car", emoji: "🚗" },
        ],
        correctIndices: [0, 3, 5, 8],
    },
    {
        prompt: "Select all images with a",
        subject: "Motorcycle",
        tiles: [
            { label: "Bus", emoji: "🚌" },
            { label: "Motorcycle", emoji: "🏍️" },
            { label: "Car", emoji: "🚗" },
            { label: "Motorcycle", emoji: "🏍️" },
            { label: "Tricycle", emoji: "🛺" },
            { label: "Truck", emoji: "🚛" },
            { label: "Motorcycle", emoji: "🏍️" },
            { label: "Bicycle", emoji: "🚲" },
            { label: "Motorcycle", emoji: "🏍️" },
        ],
        correctIndices: [1, 3, 6, 8],
    },
];

export default function CaptchaModal({ onVerify, onClose }) {
    // phase: "checkbox" | "checking" | "challenge" | "wrong"
    const [phase, setPhase] = useState("checkbox");
    const [challenge, setChallenge] = useState(null);
    const [selected, setSelected] = useState([]);
    const [wrongAnim, setWrongAnim] = useState(false);

    // pick a random challenge when mounting
    useEffect(() => {
        const idx = Math.floor(Math.random() * CHALLENGES.length);
        setChallenge(CHALLENGES[idx]);
    }, []);

    // ── Step 1: user ticks the checkbox ──────────────────────────────────────
    const handleCheckbox = () => {
        if (phase !== "checkbox") return;
        setPhase("checking");
        // simulate a brief processing moment, then show the image challenge
        setTimeout(() => setPhase("challenge"), 1200);
    };

    // ── Step 2: user selects / deselects tiles ────────────────────────────────
    const toggleTile = (idx) => {
        setSelected((prev) =>
            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
    };

    // ── Step 3: verify ────────────────────────────────────────────────────────
    const handleVerify = () => {
        if (!challenge) return;
        const correct = challenge.correctIndices;
        const isRight =
            selected.length === correct.length &&
            correct.every((i) => selected.includes(i));

        if (isRight) {
            onVerify("captcha-verified");
        } else {
            // shake + reset
            setWrongAnim(true);
            setTimeout(() => {
                setWrongAnim(false);
                setSelected([]);
                // rotate to next challenge
                setChallenge((prev) => {
                    const nextIdx = (CHALLENGES.indexOf(prev) + 1) % CHALLENGES.length;
                    return CHALLENGES[nextIdx];
                });
            }, 700);
        }
    };

    // ── Step 3b: skip (reload new challenge) ─────────────────────────────────
    const handleSkip = () => {
        setSelected([]);
        setChallenge((prev) => {
            const nextIdx = (CHALLENGES.indexOf(prev) + 1) % CHALLENGES.length;
            return CHALLENGES[nextIdx];
        });
    };

    return (
        <div className="cm-overlay" onClick={onClose}>
            <div className="cm-modal" onClick={(e) => e.stopPropagation()}>

                {/* ── Checkbox phase ── */}
                {(phase === "checkbox" || phase === "checking") && (
                    <>
                        <div className="cm-box-header">
                            <span className="cm-logo">hCaptcha</span>
                        </div>
                        <div className="cm-checkbox-row">
                            <button
                                className={`cm-checkbox ${phase === "checking" ? "cm-checking" : ""}`}
                                onClick={handleCheckbox}
                                aria-label="I am human"
                            >
                                {phase === "checking" ? (
                                    <span className="cm-spinner" />
                                ) : (
                                    <span className="cm-checkmark">✓</span>
                                )}
                            </button>
                            <span className="cm-checkbox-label">I am human</span>
                            <div className="cm-badge">
                                <span className="cm-shield">🛡</span>
                                <span className="cm-badge-text">Privacy</span>
                            </div>
                        </div>
                        <div className="cm-footer-bar">
                            <span>Secure verification powered by hCaptcha</span>
                        </div>
                    </>
                )}

                {/* ── Image challenge phase ── */}
                {phase === "challenge" && challenge && (
                    <>
                        <div className="cm-challenge-header">
                            <div className="cm-challenge-icon">🖼️</div>
                            <div className="cm-challenge-text">
                                <strong>{challenge.prompt}</strong>
                                <span className="cm-subject"> {challenge.subject}</span>
                            </div>
                            <button className="cm-close-btn" onClick={onClose}>×</button>
                        </div>

                        <p className="cm-instruction">
                            Click each image that matches. If there are none, click <em>Skip</em>.
                        </p>

                        <div className={`cm-grid ${wrongAnim ? "cm-wrong-shake" : ""}`}>
                            {challenge.tiles.map((tile, idx) => (
                                <button
                                    key={idx}
                                    className={`cm-tile ${selected.includes(idx) ? "cm-tile-selected" : ""}`}
                                    onClick={() => toggleTile(idx)}
                                    aria-label={tile.label}
                                >
                                    <span className="cm-tile-emoji">{tile.emoji}</span>
                                    <span className="cm-tile-label">{tile.label}</span>
                                    {selected.includes(idx) && (
                                        <span className="cm-tile-check">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="cm-actions">
                            <button className="cm-skip-btn" onClick={handleSkip}>
                                🔄 Skip
                            </button>
                            <button
                                className="cm-verify-btn"
                                onClick={handleVerify}
                                disabled={selected.length === 0}
                            >
                                Verify
                            </button>
                        </div>

                        <div className="cm-footer-bar">
                            <span>Secure verification powered by hCaptcha</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
