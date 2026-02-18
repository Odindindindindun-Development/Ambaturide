"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import "./DriverCss/Reviews.css";
import DriverHeader from '../../src/DriverHeader.jsx'
import { useRequireDriver } from "../utils/authGuards.jsx";

function StarRating({ value = 5, max = 5 }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="starRating">
      {stars.map((s) => (
        <svg
          key={s}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={s <= value ? "#000000" : "none"}
          stroke={s <= value ? "#000000" : "#e0e0e0"}
          strokeWidth="1.4"
          className="star"
        >
          <path d="M12 .587l3.668 7.431L23.5 9.75l-5.75 5.605L19.335 24 12 19.897 4.665 24l1.585-8.645L.5 9.75l7.832-1.732L12 .587z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ userName, date, rating, avatarUrl, reviewText }) {
  return (
    <article className="reviewCard">
      <div className="reviewHeader">
        <div className="userInfo">
          <div className="userAvatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="avatarImg" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/profile-pictures/default.jpg" }} />
            ) : (
              <div className="avatarFallback">{userName?.charAt(0)?.toUpperCase() || "U"}</div>
            )}
          </div>
          <div className="userDetails">
            <span className="userName">{userName}</span>
            <div className="userMeta">
              <span className="reviewDate">{date}</span>
            </div>
          </div>
        </div>
        <div className="ratingSection">
          <StarRating value={rating} />
          <span className="ratingValue">{rating}.0</span>
        </div>
      </div>
      <p className="reviewText">{reviewText}</p>
    </article>
  );
}

function Reviews() {
  useRequireDriver();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // get driver id from localStorage
  const getDriverId = () => {
    try {
      const raw = localStorage.getItem("driver") || localStorage.getItem("user");
      if (!raw) return null;
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return obj?.DriverID || obj?.id || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const driverId = getDriverId();
    if (!driverId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/driver/${driverId}/ratings`);
        if (res.data.success) {
          // normalize avatar url: if relative path, prefix host
          const normalized = res.data.ratings.map(r => {
            const avatar = r.PassengerPicture;
            const avatarUrl = avatar
              ? (/^https?:\/\//i.test(avatar) ? avatar : `http://localhost:3001${avatar.startsWith("/") ? avatar : `/${avatar}`}`)
              : null;
            return {
              id: r.RatingID || r.CreatedAt + Math.random(),
              userName: `${r.FirstName || ""} ${r.LastName || ""}`.trim() || "Anonymous",
              date: new Date(r.CreatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              rating: Number(r.Rating) || 0,
              avatarUrl,
              reviewText: r.Comment || "No comment provided"
            };
          });

          // Calculate statistics
          const totalReviews = normalized.length;
          const averageRating = totalReviews > 0
            ? (normalized.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

          const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          normalized.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
              ratingDistribution[r.rating]++;
            }
          });

          setRatings(normalized);
          setStats({
            averageRating,
            totalReviews,
            ratingDistribution
          });
        } else {
          setRatings([]);
        }
      } catch (err) {
        console.error("Failed to load ratings:", err);
        setRatings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <DriverHeader />
      <div className="pageContainer">
        <div className="contentWrapper">
          <main className="mainContent">
            {/* Header Section */}
            <div className="reviewsHeader">
              <div className="headerLeft">
                <h1 className="pageTitle">Driver Reviews</h1>
                <p className="pageSubtitle">Customer feedback and ratings</p>
              </div>
              {stats.totalReviews > 0 && (
                <div className="headerStats">
                  <div className="averageRating">
                    <span className="ratingNumber">{stats.averageRating}</span>
                    <div className="ratingDetails">
                      <StarRating value={Math.round(stats.averageRating)} />
                      <span className="totalReviews">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            {stats.totalReviews > 0 && (
              <div className="ratingDistribution">
                <h3 className="distributionTitle">Rating Breakdown</h3>
                <div className="distributionBars">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="distributionRow">
                      <span className="starsLabel">{stars} stars</span>
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{
                            width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[stars] / stats.totalReviews) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="countLabel">({stats.ratingDistribution[stars]})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <section className="reviewsContainer">
              {loading ? (
                <div className="loadingState">Loading reviews...</div>
              ) : ratings.length === 0 ? (
                <div className="emptyState">
                  <div className="emptyIcon">⭐</div>
                  <h3>No Reviews Yet</h3>
                  <p>You haven't received any reviews from passengers yet.</p>
                </div>
              ) : (
                <>
                  <div className="reviewsHeaderSection">
                    <h2 className="reviewsTitle">All Reviews ({ratings.length})</h2>
                  </div>
                  <div className="reviewsGrid">
                    {ratings.map((r) => (
                      <ReviewCard key={r.id} {...r} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

export default Reviews;