import { NextResponse } from "next/server";

const PUBLIC_ONLY_ROUTES = new Set(["/login", "/register"]);

const ADMIN_EXACT_ROUTES = new Set([
  "/dashboard",
  "/students",
  "/add-student",
  "/prediction",
  "/model-training",
  "/evaluation",
  "/placement-dashboard",
  "/schedule-interview",
  "/interviews",
  "/mock-interview-requests",
  "/create-assessment",
  "/assessments",
]);

const ADMIN_PREFIX_ROUTES = ["/edit-student/", "/admin/"];

const STUDENT_EXACT_ROUTES = new Set([
  "/my-interviews",
  "/student/interviews",
  "/student/interview-result",
  "/student/assessments",
  "/student/assessment-result",
  "/my-assessments",
  "/mock-interview-contact",
  "/request-interview",
  "/student/results",
  "/my-results",
  "/my-requests",
  "/my-request",
  "/assessment-result",
]);

const STUDENT_PREFIX_ROUTES = [
  "/student/take-assessment/",
  "/take-assessment/",
];

const SHARED_PROTECTED_EXACT_ROUTES = new Set([
  "/student-dashboard",
  "/profile",
]);
const SHARED_PROTECTED_PREFIX_ROUTES = ["/student/"];

function normalizePathname(pathname) {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
}

function matchesAnyPrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname) {
  return (
    ADMIN_EXACT_ROUTES.has(pathname) ||
    matchesAnyPrefix(pathname, ADMIN_PREFIX_ROUTES)
  );
}

function isStudentRoute(pathname) {
  return (
    STUDENT_EXACT_ROUTES.has(pathname) ||
    matchesAnyPrefix(pathname, STUDENT_PREFIX_ROUTES)
  );
}

function isSharedProtectedRoute(pathname) {
  return (
    SHARED_PROTECTED_EXACT_ROUTES.has(pathname) ||
    matchesAnyPrefix(pathname, SHARED_PROTECTED_PREFIX_ROUTES)
  );
}

function getRoleHome(role) {
  return role === "admin" ? "/dashboard" : "/student-dashboard";
}

function buildRedirect(request, targetPath) {
  return NextResponse.redirect(new URL(targetPath, request.url));
}

function buildLoginRedirect(request, pathname) {
  const loginUrl = new URL("/login", request.url);
  if (pathname && pathname !== "/") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export function middleware(request) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const isAuthed = request.cookies.get("sps_auth")?.value === "1";
  const role = request.cookies.get("sps_role")?.value || "";

  if (PUBLIC_ONLY_ROUTES.has(pathname)) {
    if (isAuthed) {
      return buildRedirect(request, getRoleHome(role));
    }
    return NextResponse.next();
  }

  const adminRoute = isAdminRoute(pathname);
  const studentRoute = isStudentRoute(pathname);
  const sharedProtectedRoute = isSharedProtectedRoute(pathname);

  if (!adminRoute && !studentRoute && !sharedProtectedRoute) {
    return NextResponse.next();
  }

  if (!isAuthed) {
    return buildLoginRedirect(request, pathname);
  }

  if (adminRoute && role !== "admin") {
    return buildRedirect(request, getRoleHome(role));
  }

  if (studentRoute && role !== "student") {
    return buildRedirect(request, getRoleHome(role));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
