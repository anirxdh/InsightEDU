import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingSlider.css';

const cardData = [
  { id: 1, title: 'Grad', image: '/images/graduation.jpg', route: '/graduation' },
  { id: 2, title: 'Race', image: '/images/demographics.jpg', route: '/demographics' },
  { id: 3, title: 'FRP', image: '/images/frp.jpg', route: '/frp' },
  { id: 4, title: 'GPA', image: '/images/gpa.jpg', route: '/gpa' },
  { id: 5, title: 'Chronic', image: '/images/attendance.jpg', route: '/attendance' },
  { id: 6, title: 'Staff', image: '/images/staff.jpg', route: '/staff' },
];

const LandingSlider = () => {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const quantity = cardData.length;
  const angle = 360 / quantity;
  const intervalRef = useRef();

  // On mount, animate a full carousel cycle (right rotation N times)
  useEffect(() => {
    let count = 0;
    intervalRef.current = setInterval(() => {
      setRotation((prev) => prev - angle);
      count++;
      if (count >= quantity) {
        clearInterval(intervalRef.current);
      }
    }, 20);
    return () => clearInterval(intervalRef.current);
  }, [angle, quantity]);

  const handleCardClick = (route) => {
    navigate(route);
  };

  // Determine which card is currently at the front based on rotation
  const activeIndex = (() => {
    const steps = Math.round(-rotation / angle);
    const idx = ((steps % quantity) + quantity) % quantity;
    return idx;
  })();

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
        <h1 data-content={cardData[activeIndex].title}>
          {cardData[activeIndex].title}
        </h1>
        <div className="author">
          <h2>Select a Dashboard</h2>
        </div>
      </div>
    </div>
  );
};

export default LandingSlider; 