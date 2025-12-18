const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * STATIC FILE SERVING
 * Serves files from the 'public' directory with support for Clean URLs.
 */
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html', 'htm']
}));

// Home route explicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for 404s
app.use((req, res) => {
    res.status(404).redirect('/');
});

app.listen(PORT, () => {
    console.log(`FoodBridge Server running on port ${PORT}`);
});
