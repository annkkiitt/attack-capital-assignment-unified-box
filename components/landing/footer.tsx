export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-muted/30 border-t">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {currentYear} Attack Capital Assignment. Developed by Ankit Rawat. All rights reserved.</p>
      </div>
    </footer>
  );
}

