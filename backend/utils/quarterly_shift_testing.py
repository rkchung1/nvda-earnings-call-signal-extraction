import os
import json
import plotly.graph_objects as go

# Config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../data")
INPUT_FILE = os.path.join(DATA_DIR, "sentiment_results.json")


# Load data
def load_data():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# Prepare data for plotting
def prepare_sentiment_data(data, section="management"):
    quarters = []
    pos, neu, neg, net_sentiment = [], [], [], []

    for d in data:
        q = d["quarter"]
        scores = d[f"{section}_scores"]
        total = sum(scores.values()) or 1e-6  # avoid division by zero

        quarters.append(q)
        pos.append(scores["positive"] / total)
        neu.append(scores["neutral"] / total)
        neg.append(scores["negative"] / total)
        net_sentiment.append(scores["positive"] - scores["negative"])

    return quarters, pos, neu, neg, net_sentiment


# Create sentiment chart
def create_sentiment_chart(quarters, pos, neu, neg, net_sentiment, title):
    # Compute stacked bar positions:
    #   - Negative below 0
    #   - Neutral around 0 (split equally up/down)
    #   - Positive above 0
    neg_vals = [-n for n in neg]
    neu_vals = [n / 2 for n in neu]   # top half
    neu_vals_bottom = [-n / 2 for n in neu]  # bottom half

    # Create figure
    fig = go.Figure()

    # Negative bar (bottom)
    fig.add_trace(go.Bar(
        x=quarters,
        y=neg_vals,
        name="Negative",
        marker_color="#c87a7a",
        hovertemplate="%{x}<br>Negative: %{y:.1%}<extra></extra>"
    ))

    # Neutral bar (center)
    fig.add_trace(go.Bar(
        x=quarters,
        y=neu_vals,
        base=neu_vals_bottom,  # centered around zero
        name="Neutral",
        marker_color="#c5c5c5",
        hovertemplate="%{x}<br>Neutral: %{y:.1%}<extra></extra>"
    ))

    # Positive bar (top)
    fig.add_trace(go.Bar(
        x=quarters,
        y=pos,
        name="Positive",
        marker_color="#85a1cb",
        hovertemplate="%{x}<br>Positive: %{y:.1%}<extra></extra>"
    ))

    # Net sentiment line
    fig.add_trace(go.Scatter(
        x=quarters,
        y=net_sentiment,
        mode="lines+markers+text",
        name="Net Sentiment",
        line=dict(color="black", width=2),
        marker=dict(size=8, color="black"),
        text=[f"{v*100:+.0f}%" for v in net_sentiment],
        textposition="top center",
        hovertemplate="%{x}<br>Net Sentiment: %{y:.1%}<extra></extra>"
    ))

    # Layout
    fig.update_layout(
        title=dict(
            text=f"{title} Sentiment Distribution by Quarter",
            x=0.5,
            font=dict(size=18, family="Arial", color="black")
        ),
        barmode="relative",
        bargap=0.25,
        plot_bgcolor="white",
        xaxis=dict(title="Quarter", showgrid=False),
        yaxis=dict(
            title="Sentiment Proportion",
            tickformat=".0%",
            zeroline=True,
            zerolinewidth=1.5,
            zerolinecolor="gray",
            range=[-1, 1]
        ),
        legend=dict(title="Sentiment Type", orientation="h", x=0.3, y=1.1),
        height=600
    )

    return fig


if __name__ == "__main__":
    data = load_data()

    # Management chart
    qtrs, pos, neu, neg, net_mgmt = prepare_sentiment_data(data, section="management")
    fig_mgmt = create_sentiment_chart(qtrs, pos, neu, neg, net_mgmt, "Management")
    fig_mgmt.show()

    # Q&A chart
    qtrs, pos, neu, neg, net_qa = prepare_sentiment_data(data, section="qa")
    fig_qa = create_sentiment_chart(qtrs, pos, neu, neg, net_qa, "Q&A")
    fig_qa.show()