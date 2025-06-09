import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { ChevronDown, FileText, GraduationCap, LayoutDashboard, PenBox, StarsIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const  Header = () => {
  return (

    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[background-filter]:bg-background/60">
      <nav className="mx-auto px-4 h-16 flex items-center justify-between w-full">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Logo"
            width={250}
            height={100}
            className="h-16 py-1 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center space-x-2 md-spacex-4">
          <SignedIn>
            <Link href={'/dashboard'}>
            <Button variant="outline">
              <LayoutDashboard  className="h-4 w-4"  />
              <span className="hidden md:block">industry insights</span>
            </Button>
            </Link>
         

          <DropdownMenu>
  <DropdownMenuTrigger>
      <Button>
              <StarsIcon  className="h-4 w-4"  />
              <span className="hidden md:block">Growth tools</span>
              <ChevronDown className="h-4 w-4"/>
            </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    
    <DropdownMenuItem>
          <Link href={'/resume'} className="flex items-center gap-2">
          <FileText className="h-4 w-4">
          </FileText>
          <span>build resume</span>
          </Link>
    </DropdownMenuItem>
    <DropdownMenuItem> <Link href={'/ai-cover-letter'} className="flex items-center gap-2">
          <PenBox className="h-4 w-4">
          </PenBox>
          <span>cover letter</span>
          </Link></DropdownMenuItem>
    <DropdownMenuItem> <Link href={'/interview'} className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4">
          </GraduationCap>
          <span>interview prep</span>
          </Link></DropdownMenuItem>
    
  </DropdownMenuContent>
</DropdownMenu>
 </SignedIn>
<SignedOut>
       <SignInButton>
         <Button variant="outline">Sign-In</Button>
       </SignInButton>
        <SignUpButton>
          <Button variant="outline">Sign-Up</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
  <UserButton
  appearance={{
    elements: {
      avatarBox: "w-10 h-10 rounded-full",
      userButtonPopoverCard: "shadow-xl",
      userPreviewMainIdentifier: "font-semibold",
    },
  }}
  afterSignOutUrl="/"
/>

      </SignedIn>

        </div>
      </nav>

      
    </header>
  );
};

export default Header;
