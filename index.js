const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // frontend dev URL
  credentials: true // penting untuk cookies/session
}));

require("dotenv").config();

// session
app.use(
  session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
  })
);

// strategy
const strategy = new Auth0Strategy(
  {
    domain: process.env.DOMAIN,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CLIENT_URL,
    passReqToCallback: true,
  },
  (req, accessToken, refreshToken, extraParams, profile, done) => {
    return done(null, profile);
  }
);

passport.use(strategy);

// middleware
app.use(passport.initialize());
app.use(passport.session());

// setiap auth user harus masukan ke session
passport.serializeUser((user, done) => done(null, user));
// inject ke req.user
passport.deserializeUser((user, done) => done(null, user));

// ! rest
// app.get("/", (req, res) => {
//   if (req.user) {
//     res.send(`<h1>Hello ${req.user.displayName}</h1>`);
//   } else {
//     res.send('<h1>Welcome, please <a href="/login">login</a></h1>');
//   }
// });

app.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
    prompt: "login", // reauthenticate
  })
);

app.get(
  "/callback",
  passport.authenticate("auth0", {
    failureRedirect: "/",
  }),
  (req, res) => {
    // res.redirect("https://shoping-ruddy.vercel.app/");
    res.redirect("http://localhost:5173/");
  }
);

// wajib fetch credential
app.get("/users", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(req);
});

module.exports = app;

// app.listen(3000, () => console.log(`Server running on http://localhost:3000`));
