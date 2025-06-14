import { motion } from "framer-motion";
import { LinkButton, Button } from "./ui/Button";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStartWriting = () => {
    if (currentUser) {
      navigate("/creator/new-story");
    } else {
      // If not logged in, redirect to login page or show login modal
      // For now, we'll just navigate to creator which will show the login screen through PrivateRoute
      navigate("/creator");
    }
  };

  return (
    <section className="py-16 md:py-20 w-full">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-900 dark:to-dark-900"
        >
          <div className="absolute inset-0 bg-pattern opacity-10"></div>

          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary-500 opacity-20 rounded-full blur-3xl"></div>

          <div className="relative py-12 md:py-16 px-6 md:px-12 text-center md:text-left md:flex md:items-center md:justify-between">
            <div className="md:max-w-lg mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                Ready to Shape the Next Bestseller?
              </h2>
              <p className="text-base md:text-lg text-primary-100 dark:text-primary-200 max-w-xl">
                Join PlotMint today and become part of a new era of interactive
                storytelling. Create, collect, and influence stories alongside a
                community of passionate readers and writers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-4">
              <Button
                onClick={handleStartWriting}
                variant="cta-primary"
                size="lg"
                className="md:w-full md:min-w-[180px]"
              >
                Start Writing
              </Button>
              <LinkButton
                to="/stories"
                variant="cta-secondary"
                size="lg"
                className="md:w-full md:min-w-[180px]"
              >
                Explore Stories
              </LinkButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
