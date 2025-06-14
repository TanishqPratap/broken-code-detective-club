
import { ReactNode } from "react";
import { Link, LinkProps } from "react-router-dom";

interface ValidatedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: ReactNode;
  fallback?: string;
}

const LinkValidator = ({ to, children, fallback = "/", ...props }: ValidatedLinkProps) => {
  // Basic validation for internal routes
  const isValidRoute = (path: string): boolean => {
    const validRoutes = [
      '/',
      '/profile',
      '/creator',
      '/discover',
      '/posts',
      '/dm',
      '/stream-payment-success'
    ];
    
    const dynamicRoutes = [
      /^\/creator\/[a-f0-9-]{36}$/i,
      /^\/creator\/[a-f0-9-]{36}\/trailer\/[a-f0-9-]{36}$/i,
      /^\/posts\/[a-f0-9-]{36}$/i,
      /^\/watch\/[a-f0-9-]{36}$/i
    ];
    
    return validRoutes.includes(path) || dynamicRoutes.some(regex => regex.test(path));
  };

  const validatedTo = isValidRoute(to) ? to : fallback;

  return (
    <Link to={validatedTo} {...props}>
      {children}
    </Link>
  );
};

export default LinkValidator;
