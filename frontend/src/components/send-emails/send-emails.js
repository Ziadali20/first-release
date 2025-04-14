import React from "react";
import emailjs from "@emailjs/browser";

export default function SendEmails() {
  const usersData = [
    { userName: "Ziad", email: "ziadali4416@gmail.com", message: "We have special offers tomorrow" },
  ];

  const sendEmail = (user) => {
    const templateParams = {
      to_name: user.userName,
      to_email: user.email,   
      message: user.message,  
      offer_link: "https://your-company.com/offer", 
    };

    emailjs
      .send("your servixe code", "your template code", templateParams, "your key")
      .then((response) => {
        console.log("Email sent successfully!", response);
        alert(`Email sent to ${user.email}`);
        console.log(response)
      })
      .catch((error) => {
        console.error("Failed to send email:", error);
        alert(`Failed to send email to ${user.email}`);
      });
  };

  return (
    <div style={{ padding: "2% 10%" }}>
      {usersData.length > 0 ? (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>User Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {usersData.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.userName}</td>
                <td>{item.email}</td>
                <td>{item.message}</td>
                <td>
                  <button type="button" className="btn btn-primary" onClick={() => sendEmail(item)}>
                    Send Message
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <h1>No data available</h1>
      )}
    </div>
  );
}



