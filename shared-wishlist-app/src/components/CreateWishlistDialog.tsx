import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

interface CreateWishlistDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateWishlistDialog: React.FC<CreateWishlistDialogProps> = ({
  open,
  onClose,
}) => {
  const [wishlistName, setWishlistName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wishlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ wishlistName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create wishlist");
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create a New Wishlist</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please enter the name of your new wishlist.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Wishlist Name"
          type="text"
          fullWidth
          value={wishlistName}
          disabled={loading}
          onChange={(e) => setWishlistName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={handleCreate}
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWishlistDialog;
