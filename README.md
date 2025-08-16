# Zomato Chatbot – Bengaluru Restaurants
[Live Demo](https://zomato-chatbot-frontend.vercel.app/)

A smart conversational chatbot built to simulate Zomato-like functionality, focusing on restaurants in **Bengaluru**.  
Users can interact with the bot to **track orders, book dine-ins, and order food**, all via natural language using **Dialogflow**.

## Table of Contents
1. [Overview](#overview)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [Architecture](#architecture)  
5. [Setup Instructions](#setup-instructions)  
6. [Environment Variables](#environment-variables)  
7. [Future Improvements](#future-improvements)  
8. [Contributors](#contributors)  

## Overview
The **Zomato Chatbot** is an AI-powered food ordering and restaurant management assistant designed to help users:  
- Track online orders  
- Track dine-in bookings  
- Book a dine-in table  
- Order food directly  
- Cancel Order
- Cancel dine-in

The bot is trained on **Bengaluru hotel data** using the **Zomato Bengaluru 2022 dataset from Kaggle**, combined with custom **Dialogflow intents** and contexts for smooth conversation flows

## Features
- **Order Tracking** – Get real-time order status  
- **Dine-in Tracking** – View dine-in reservations  
- **Book Dine-in** – Reserve tables at Bengaluru hotels  
- **Food Ordering** – Order items from menus via chat  
- **Cancel Order** - Cancel ongoing orders or previous orders
- **Cancel Dine-in** - Cancel dine-in bookings
- **Natural Language Processing** – Powered by Dialogflow  
- **Dataset:** [Zomato Bengaluru 2022 – Kaggle](https://www.kaggle.com/datasets/vora1011/zomato-bangalore-restaurants-2022)
- **Persistent Data Storage** – PostgreSQL via Supabase  

## Tech Stack
- **Frontend:** React.js  
- **Backend:** NestJS  
- **Database:** PostgreSQL (Supabase)  
- **NLP Engine:** Dialogflow ES  
- **Hosting:** Render (Backend) , Vercel (Frontend) 

## Architecture

```
[React Frontend with Dialogflow Messenger Beta]
                  ⬇
        [Dialogflow Agent (NLP)]
                  ⬇
        [NestJS Webhook Backend]
                  ⬇
    [Supabase / PostgreSQL Database]
                  ⬆
        Response returned to Dialogflow
                  ⬆
[Frontend Chat Widget displays bot's reply]
```

**Flow Explanation:**

1. **User opens the React app**, which has **Dialogflow Messenger Beta** embedded.
2. User sends a message → The message goes **directly to Dialogflow** (Google-hosted).
3. Dialogflow detects the intent and, if needed, **calls the webhook** (NestJS backend).
4. The backend fetches or updates data from **Supabase/PostgreSQL**.
5. The backend sends the data back to Dialogflow.
6. Dialogflow formats the reply and sends it back to the **Messenger widget** in the frontend — without the frontend needing to handle the response logic.

## Setup Instructions

### Clone the repository
```bash
git clone https://github.com/your-repo/zomato-chatbot.git
cd zomato-chatbot
````

### Install dependencies

#### Backend:

```bash
cd backend
npm install
```

#### Frontend:

```bash
cd frontend
npm install
```

### Setup Database (Supabase / PostgreSQL)

* Create a Supabase project
* Run SQL scripts

### Configure Dialogflow

* Create Dialogflow ES agent
* Create Intents/Context

### Run locally

#### Backend:

```bash
next start --watch
```

#### Frontend:

```bash
npm run dev
```

## Environment Variables

Create `.env` files in **backend** with the following:

**Backend `.env`:**

```
SUPABASE_KEY=your_supabase_key
SUPABASE_PASS=your_supabase_password
SUPABASE_HOST=your_supabase_db_name
DATABASE_URL=your_database_url
```

## Future Improvements

* Support for **multiple cities**
* **Payment gateway integration**
* **Voice command support**
* **User authentication**

## Contributors
- Kumar Utkarsh
- Adarsh Dhakar
- Harsh Maurya
- Bipasha Ray
