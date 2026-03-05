declare namespace Express {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
    user?: {
      userId: string;
      email: string;
      role: 'admin' | 'analyst' | 'viewer';
    };
  }
}
