import React from "react";
import AdminSidebar from "../components/AdminSidebar";

const VotingStatus = () => {
  return (
    <>
      <AdminSidebar />
      <div className="page-container">
        <h2>Voting Status</h2>
        <div className="status-box">
          <p><b>Status:</b> Ongoing</p>
          <p><b>Total Voters:</b> 120</p>
          <p><b>Votes Cast:</b> 95</p>
          <p><b>Remaining:</b> 25</p>
        </div>
      </div>
    </>
  );
};

export default VotingStatus;