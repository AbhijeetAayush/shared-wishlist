import React, { useState, useEffect } from "react";
import withAuth from "@/hoc/withAuth";
import NavBar from "@/components/NavBar";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CreateWishlistDialog from "@/components/CreateWishlistDialog";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { Wishlist } from "@/types/wishlist";
import CardContent from "@mui/material/CardContent";
import { Card, Grid } from "@mui/material";

function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    const fetchWishlists = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/wishlist`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch wishlists");
        }

        const data = await response.json();
        setWishlists(data.wishlists.wishlists);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlists();
  }, []);

  return (
    <>
      <NavBar />
      <Container maxWidth="sm" style={{ marginTop: "50px" }}>
        <Typography variant="h4" gutterBottom>
          Create a New Wishlist
        </Typography>
        <Button variant="contained" color="primary" onClick={handleDialogOpen}>
          Create Wishlist
        </Button>
        {loading ? (
          <CircularProgress style={{ marginTop: "20px" }} />
        ) : error ? (
          <Alert severity="error" style={{ marginTop: "20px" }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3} style={{ marginTop: "20px" }}>
            {wishlists.map((wishlist, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      {wishlist.wishlistName}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      <CreateWishlistDialog open={dialogOpen} onClose={handleDialogClose} />
    </>
  );
}

export default withAuth(Home);
