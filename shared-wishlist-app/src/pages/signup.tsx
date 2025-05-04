import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { Card, CardContent } from "@mui/material";
import { useRouter } from "next/router";
import Link from "next/link";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      console.log("Signup successful");
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: "100px" }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Sign Up
          </Typography>
          <form onSubmit={handleSignup}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              style={{ marginTop: "20px" }}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
          {error && (
            <Alert severity="error" style={{ marginTop: "20px" }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" style={{ marginTop: "20px" }}>
            Already have an account? <Link href="/login">Log In</Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Signup;
