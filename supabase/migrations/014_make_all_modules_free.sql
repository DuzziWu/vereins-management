-- Make all modules free and non-premium for testing
UPDATE modules SET
    is_premium = false,
    price = 'Kostenlos';
