import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingSlider.css';

const cardData = [
  { id: 1, title: 'Attendance', image: '/images/attendance.jpg', route: '/attendance' },
  { id: 2, title: 'Behaviour', image: '/images/behaviour.jpg', route: '/behaviour' },
  { id: 3, title: 'Demographics', image: '/images/demographics.jpg', route: '/demographics' },
  { id: 4, title: 'FRP', image: '/images/frp.jpg', route: '/frp' },
  { id: 5, title: 'GPA', image: '/images/gpa.jpg', route: '/gpa' },
  { id: 6, title: 'Graduation', image: '/images/graduation.jpg', route: '/graduation' },
  { id: 7, title: 'Staff', image: '/images/staff.jpg', route: '/staff' },
];

const LandingSlider = () => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const quantity = cardData.length;
  const angle = 360 / quantity;

  const handleCardClick = (route) => {
    navigate(route);
  };

  const rotateLeft = () => {
    setRotation((prev) => prev + angle);
  };

  const rotateRight = () => {
    setRotation((prev) => prev - angle);
  };

  return (
    <div className="banner">
      <button className="carousel-arrow left" onClick={rotateLeft} aria-label="Scroll Left">&#8592;</button>
      <div
        className="slider"
        style={{
          '--quantity': quantity,
          transform: `perspective(1000px) rotateX(-16deg) rotateY(${rotation}deg)`
        }}
      >
        {cardData.map((card, index) => (
          <div
            key={card.id}
            className="item"
            style={{ '--position': index + 1 }}
            onClick={() => handleCardClick(card.route)}
          >
            <img src={card.image} alt={card.title} />
          </div>
        ))}
      </div>
      <button className="carousel-arrow right" onClick={rotateRight} aria-label="Scroll Right">&#8594;</button>
      <div className="content">
        <h1 data-content="EDUDATA">EDUDATA</h1>
        <div className="author">
          <h2>Select a Dashboard</h2>
        </div>
      </div>
    </div>
  );
};

export default LandingSlider; 