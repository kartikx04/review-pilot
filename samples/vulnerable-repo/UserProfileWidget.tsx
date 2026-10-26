import React, { useState, useEffect } from 'react';

interface UserData {
  displayName: string;
  bio: string;
}

export const UserProfileWidget: React.FC<{ user: UserData }> = ({ user }) => {
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    // VULNERABILITY 1: Memory leak - setInterval without cleanup callback
    setInterval(() => {
      fetch('/api/user/activities')
        .then((res) => res.json())
        .then((data) => setActivityCount(data.count));
    }, 3000);
  }, []);

  return (
    <div className="profile-card">
      <h2>{user.displayName}</h2>
      {/* VULNERABILITY 2: Stored Cross-Site Scripting (XSS) via un-sanitized HTML */}
      <div className="bio" dangerouslySetInnerHTML={{ __html: user.bio }} />
      <span className="badge">Active events: {activityCount}</span>
    </div>
  );
};
