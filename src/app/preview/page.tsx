"use client";
import { useState } from "react";

export default function Preview() {
  const [voted, setVoted] = useState(false);

  const handleVote = async (vote: string) => {
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote }),
      });
      setVoted(true);
    } catch (error) {
      console.error("Error recording vote:", error);
    }
  };

  return (
    <div className="main-container">
      <main className="text-center">
        <h1>
          Welcome to our Awesome Project!
        </h1>

        <p className="mt-1 mb-2">
          Ever try to grab coffee, hit the gym, or catch a concert with friends but can’t line up schedules?
          We’re testing a new app that syncs with your calendar (Google/Apple), finds when your free time overlaps with others, and suggests activities you can do together—from workouts to study sessions to last-minute hangs.
        </p>

        {!voted ? (
          <div>
            <button
              onClick={() => handleVote("up")}
              className="btn btn-up"
              style={{ marginRight: "1rem" }}
            >
              Up!
            </button>
            <button
              onClick={() => handleVote("down")}
              className="btn btn-down"
            >
              Down
            </button>
          </div>
        ) : (
          <p className="mt-2">Thanks for your feedback!</p>
        )}
      </main>
    </div>
  );
}
