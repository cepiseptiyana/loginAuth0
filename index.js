const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

const app = express();

app.use(
  cors({
    origin: "https://shoping-ruddy.vercel.app",
    // origin: "http://localhost:5173", // frontend dev URL
    credentials: true, // penting untuk cookies/session
  })
);

require("dotenv").config();

// session
app.use(
  session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // wajib true di production (https)
      // sameSite: "none", // wajib kalau frontend beda domain
    },
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
    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("https://shoping-ruddy.vercel.app/");
    });

    // res.redirect("http://localhost:5173/");
  }
);

// wajib fetch credential
app.get("/users", (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false, user: null });
  }
  res.json({ loggedIn: true, user: req.user });
});

// logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.clearCookie("connect.sid"); // optional: hapus cookie di browser
      res.redirect("https://shoping-ruddy.vercel.app/");
      // res.redirect("http://localhost:5173/");
    }
  });
});

module.exports = app;
// app.listen(3000, () => {
//   console.log("server running");
// });
