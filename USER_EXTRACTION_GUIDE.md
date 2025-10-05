# Get User from Bearer Token - Complete Guide

## 📚 Overview
This guide explains how to extract the authenticated user from the Bearer token in the Authorization header.

## 🔧 Implementation

### **1. JWT Strategy** (`src/modules/authentication/strategies/jwt.strategy.ts`)
Automatically validates the JWT token and extracts the user:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { JwtPayload } from '../interfaces/auth.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove password from user object
    delete user.password;
    
    return user;
  }
}
```

### **2. JWT Auth Guard** (`src/modules/authentication/guards/jwt-auth.guard.ts`)
Guards routes that require authentication:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
```

### **3. Current User Decorator** (`src/shared/decorators/current-user.decorator.ts`)
Extracts user from request:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/authentication/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## 🚀 Usage Examples

### **Example 1: Using @CurrentUser() Decorator (Recommended)**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { User } from '../authentication/entities/user.entity';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  
  @Get()
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Get('workspaces')
  getMyWorkspaces(@CurrentUser() user: User) {
    // User object is automatically populated from JWT token
    return {
      userId: user.id,
      message: `Getting workspaces for ${user.name}`,
    };
  }
}
```

### **Example 2: Using Request Object**

```typescript
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { User } from '../authentication/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get('me')
  getCurrentUser(@Req() request: Request & { user: User }) {
    const user = request.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

### **Example 3: In Workspace Controller**

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { User } from '../../authentication/entities/user.entity';
import { WorkspaceService } from '../services/workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async createWorkspace(
    @Body() createWorkspaceDto: any,
    @CurrentUser() user: User,
  ) {
    // Use user.id to set createdBy, updatedBy, etc.
    return this.workspaceService.create({
      ...createWorkspaceDto,
      createdBy: user.id,
      updatedBy: user.id,
    });
  }
}
```

### **Example 4: Combining with Other Guards**

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { User } from '../../authentication/entities/user.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, UserWorkspacePermissionGuard)
export class CampaignController {
  
  @Post()
  @RequirePermission(Resource.CAMPAIGN, Action.CREATE)
  async createCampaign(
    @Body() createCampaignDto: any,
    @CurrentUser() user: User,
  ) {
    // Both authentication and permission checks are done
    // User is automatically available
    return {
      message: `Campaign created by ${user.name}`,
      userId: user.id,
    };
  }
}
```

## 📦 Required Packages

Make sure these packages are installed:

```bash
npm install @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

## ⚙️ Configuration

### **Update .env file:**
```env
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
```

### **Authentication Module is already configured** with:
- ✅ PassportModule
- ✅ JwtModule
- ✅ JwtStrategy
- ✅ JwtAuthGuard

## 🔐 How It Works

1. **Client sends request** with Bearer token:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **JwtAuthGuard** intercepts the request

3. **JwtStrategy** extracts and validates the token:
   - Extracts token from `Authorization: Bearer <token>`
   - Verifies signature using `JWT_SECRET`
   - Decodes payload to get user ID

4. **Strategy queries database** to get full user object

5. **User object attached to request** as `request.user`

6. **@CurrentUser() decorator** extracts user from request

7. **Controller receives** authenticated user object

## 📝 User Object Structure

The user object available via `@CurrentUser()` contains:

```typescript
{
  id: string;           // UUID
  email: string;        // user@example.com
  name: string;         // John Doe
  createdAt: Date;      // 2025-10-01T...
  updatedAt: Date;      // 2025-10-01T...
  createdBy: string;    // UUID of creator (self for root users)
  updatedBy: string;    // UUID of last updater
  // password is removed for security
}
```

## ⚠️ Important Notes

### **1. Always Use Guards**
```typescript
@UseGuards(JwtAuthGuard) // Required for authentication
```

### **2. Password Removed**
The JWT strategy automatically removes the password field for security.

### **3. Token Expiration**
- Access tokens expire in **15 minutes**
- Refresh tokens expire in **7 days**
- Use refresh token endpoint to get new access token

### **4. Error Handling**
- **401 Unauthorized** - Invalid or missing token
- **403 Forbidden** - Valid token but insufficient permissions

## 🎯 Best Practices

### **✅ DO:**
- Use `@CurrentUser()` decorator for cleaner code
- Combine with permission guards for authorization
- Remove password before sending user object to client
- Use environment variables for JWT_SECRET

### **❌ DON'T:**
- Don't manually parse JWT tokens in controllers
- Don't expose password field
- Don't hardcode JWT_SECRET
- Don't skip authentication guards on protected routes

## 🔄 Complete Flow Diagram

```
1. Client Request
   │
   ├─ Authorization: Bearer <token>
   │
2. JwtAuthGuard
   │
   ├─ Validates token exists
   │
3. JwtStrategy
   │
   ├─ Extracts token from header
   ├─ Verifies signature
   ├─ Decodes payload
   ├─ Queries database for user
   ├─ Removes password
   │
4. Request.user = User Object
   │
5. @CurrentUser() Decorator
   │
   ├─ Extracts user from request
   │
6. Controller Method
   │
   └─ Receives authenticated user
```

## 🧪 Testing with Postman

### **1. Login to get token:**
```
POST http://localhost:3000/auth/login
Body: {
  "email": "user@example.com",
  "password": "Password123!"
}

Response: {
  "user": {...},
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### **2. Use token in protected route:**
```
GET http://localhost:3000/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. In Postman Collection Variables:**
```
access_token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then use: `Bearer {{access_token}}`

---

**Everything is ready to use!** 🎉

Just add `@UseGuards(JwtAuthGuard)` and `@CurrentUser() user: User` to any controller method to get the authenticated user from the Bearer token.
