import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-24 bg-parchment-50 dark:bg-dark-950">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-display text-8xl font-bold text-ink-900 dark:text-white mb-6">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink-800 dark:text-ink-100 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-ink-700 dark:text-ink-200 mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Link to="/">
            <Button variant="outline" size="lg">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
