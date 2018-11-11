// @flow
import React from 'react';
import './card.css';

class Card extends React.Component {
  render() {
    return (
      <div className="feed">
        <article className="card">
          <div className="card-content">
            <a className="card-content-link">
              <header className="card-header">
                <span>23 Oct 018</span>
                <h2 className="card-title">柯P</h2>
              </header>
              <section className="card-excerpt">
                <h2>:D</h2>
                <p>台北市長柯文哲在PTT上別稱</p>
              </section>
            </a>
            <footer className="card-meta">
              <span className="card-author">
                <a href="/tag/人物">人物</a>
,
                <a href="/tag/政治">政治</a>
,
                <a href="/tag/台北">台北</a>
              </span>
            </footer>
          </div>
        </article>
      </div>
    );
  }
}

export default Card;
