import { Injectable } from '@nestjs/common';
import { SocialMediaProvider } from '../interfaces/social-media-provider.interface';
import { MetaService } from './providers/meta.service';
import { LinkedInService } from './providers/linkedin.service';
import { TwitterService } from './providers/twitter.service';
import { SnapchatService } from './providers/snapchat.service';
import { PlatformType } from '../entities/social-media-platform.entity';

@Injectable()
export class SocialMediaProviderFactory {
  constructor(
    private readonly metaService: MetaService,
    private readonly linkedInService: LinkedInService,
    private readonly twitterService: TwitterService,
    private readonly snapchatService: SnapchatService,
  ) {}

  getProvider(platformType: PlatformType): SocialMediaProvider {
    switch (platformType) {
      case PlatformType.META:
        return this.metaService;
      case PlatformType.LINKEDIN:
        return this.linkedInService;
      case PlatformType.TWITTER:
        return this.twitterService;
      case PlatformType.SNAPCHAT:
        return this.snapchatService;
      default:
        throw new Error(`Unsupported platform type: ${platformType}`);
    }
  }

  getSupportedPlatforms(): PlatformType[] {
    return [
      PlatformType.META,
      PlatformType.LINKEDIN,
      PlatformType.TWITTER,
      PlatformType.SNAPCHAT,
    ];
  }

  isPlatformSupported(platformType: PlatformType): boolean {
    return this.getSupportedPlatforms().includes(platformType);
  }
}
