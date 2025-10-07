import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { AgencyAccountService } from '../services/agency-account.service';
import { PlatformType } from '../entities/social-media-platform.entity';
import { AgencyAccount, AgencyAccountType } from '../entities/agency-account.entity';

@ApiTags('Agency Accounts')
@ApiBearerAuth()
@Controller('agency-accounts')
export class AgencyAccountController {
  constructor(private readonly agencyAccountService: AgencyAccountService) {}

  // ==================== Agency Account Management ====================

  @Post()
  @ApiOperation({ summary: 'Create a new agency account' })
  @ApiResponse({ status: 201, description: 'Agency account created successfully' })
  async createAgencyAccount(@Body() createDto: {
    platformType: PlatformType;
    externalAccountId: string;
    accountName: string;
    businessManagerId?: string;
    agencyId?: string;
    accountType?: AgencyAccountType;
    timezone?: string;
    currency?: string;
    capabilities?: string[];
  }, @CurrentUserId() userId: string) {
    const agencyAccount = await this.agencyAccountService.createAgencyAccount({
      ...createDto,
      userId: userId,
    });

    return {
      success: true,
      data: agencyAccount,
      message: 'Agency account created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user agency accounts' })
  @ApiResponse({ status: 200, description: 'Agency accounts retrieved successfully' })
  async getUserAgencyAccounts(@CurrentUserId() userId: string) {
    const accounts = await this.agencyAccountService.getUserAgencyAccounts(userId);
    return {
      success: true,
      data: accounts,
      message: 'Agency accounts retrieved successfully',
    };
  }

  @Get(':agencyAccountId')
  @ApiOperation({ summary: 'Get agency account details' })
  @ApiResponse({ status: 200, description: 'Agency account details retrieved successfully' })
  async getAgencyAccount(@Param('agencyAccountId') agencyAccountId: string) {
    const account = await this.agencyAccountService.getAgencyAccount(agencyAccountId);
    return {
      success: true,
      data: account,
      message: 'Agency account details retrieved successfully',
    };
  }

  @Put(':agencyAccountId')
  @ApiOperation({ summary: 'Update agency account' })
  @ApiResponse({ status: 200, description: 'Agency account updated successfully' })
  async updateAgencyAccount(
    @Param('agencyAccountId') agencyAccountId: string,
    @Body() updateDto: Partial<AgencyAccount>,
  ) {
    const account = await this.agencyAccountService.updateAgencyAccount(agencyAccountId, updateDto);
    return {
      success: true,
      data: account,
      message: 'Agency account updated successfully',
    };
  }

  @Delete(':agencyAccountId')
  @ApiOperation({ summary: 'Delete agency account' })
  @ApiResponse({ status: 200, description: 'Agency account deleted successfully' })
  async deleteAgencyAccount(@Param('agencyAccountId') agencyAccountId: string) {
    await this.agencyAccountService.deleteAgencyAccount(agencyAccountId);
    return {
      success: true,
      message: 'Agency account deleted successfully',
    };
  }

  // ==================== Agency Authentication ====================

  @Post(':agencyAccountId/auth/initiate')
  @ApiOperation({ summary: 'Initiate OAuth flow for agency account' })
  @ApiResponse({ status: 200, description: 'OAuth flow initiated successfully' })
  async initiateAgencyAuth(@Param('agencyAccountId') agencyAccountId: string) {
    const { authUrl, state } = await this.agencyAccountService.initiateAgencyAuth(agencyAccountId);
    return {
      success: true,
      data: { authUrl, state },
      message: 'OAuth flow initiated successfully',
    };
  }

  @Post(':agencyAccountId/auth/complete')
  @ApiOperation({ summary: 'Complete OAuth flow for agency account' })
  @ApiResponse({ status: 200, description: 'OAuth flow completed successfully' })
  async completeAgencyAuth(
    @Param('agencyAccountId') agencyAccountId: string,
    @Body() body: { code: string; state: string },
  ) {
    const auth = await this.agencyAccountService.completeAgencyAuth(
      agencyAccountId,
      body.code,
      body.state,
    );
    return {
      success: true,
      data: auth,
      message: 'OAuth flow completed successfully',
    };
  }

  @Get(':agencyAccountId/is-authenticated')
  @ApiOperation({ summary: 'Check if agency account is authenticated' })
  @ApiResponse({ status: 200, description: 'Authentication status retrieved successfully' })
  async isAgencyAuthenticated(@Param('agencyAccountId') agencyAccountId: string) {
    const isAuthenticated = await this.agencyAccountService.isAgencyAuthenticated(agencyAccountId);
    return {
      success: true,
      data: { isAuthenticated },
      message: isAuthenticated ? 'Agency is authenticated' : 'Agency is not authenticated',
    };
  }

  @Post(':agencyAccountId/sync')
  @ApiOperation({ summary: 'Sync agency account data from platform' })
  @ApiResponse({ status: 200, description: 'Agency account synced successfully' })
  async syncAgencyAccount(@Param('agencyAccountId') agencyAccountId: string) {
    const account = await this.agencyAccountService.syncAgencyAccount(agencyAccountId);
    return {
      success: true,
      data: account,
      message: 'Agency account synced successfully',
    };
  }

  // ==================== Agency-Client Relationship ====================

  @Post(':agencyAccountId/link/:socialMediaAccountId')
  @ApiOperation({ summary: 'Link a social media account to agency' })
  @ApiResponse({ status: 200, description: 'Account linked to agency successfully' })
  async linkAccountToAgency(
    @Param('agencyAccountId') agencyAccountId: string,
    @Param('socialMediaAccountId') socialMediaAccountId: string,
    @CurrentUserId() userId: string,
  ) {
    const account = await this.agencyAccountService.linkAccountToAgency(
      socialMediaAccountId,
      agencyAccountId,
      userId,
    );
    return {
      success: true,
      data: account,
      message: 'Social media account linked to agency successfully',
    };
  }

  @Delete(':agencyAccountId/unlink/:socialMediaAccountId')
  @ApiOperation({ summary: 'Unlink a social media account from agency' })
  @ApiResponse({ status: 200, description: 'Account unlinked from agency successfully' })
  async unlinkAccountFromAgency(
    @Param('agencyAccountId') agencyAccountId: string,
    @Param('socialMediaAccountId') socialMediaAccountId: string,
    @CurrentUserId() userId: string,
  ) {
    const account = await this.agencyAccountService.unlinkAccountFromAgency(
      socialMediaAccountId,
      userId,
    );
    return {
      success: true,
      data: account,
      message: 'Social media account unlinked from agency successfully',
    };
  }

  @Get(':agencyAccountId/managed-accounts')
  @ApiOperation({ summary: 'Get all accounts managed by this agency' })
  @ApiResponse({ status: 200, description: 'Managed accounts retrieved successfully' })
  async getAgencyManagedAccounts(@Param('agencyAccountId') agencyAccountId: string) {
    const accounts = await this.agencyAccountService.getAgencyManagedAccounts(agencyAccountId);
    return {
      success: true,
      data: accounts,
      message: 'Managed accounts retrieved successfully',
    };
  }

  @Get('social-account/:socialMediaAccountId/agency')
  @ApiOperation({ summary: 'Get agency managing a social media account' })
  @ApiResponse({ status: 200, description: 'Agency account retrieved successfully' })
  async getAccountAgency(@Param('socialMediaAccountId') socialMediaAccountId: string) {
    const agency = await this.agencyAccountService.getAccountAgency(socialMediaAccountId);
    return {
      success: true,
      data: agency,
      message: agency ? 'Agency account retrieved successfully' : 'No agency managing this account',
    };
  }

  // ==================== Agency Verification & Discovery ====================

  @Get(':agencyAccountId/accessible-pages')
  @ApiOperation({ summary: 'Get all Facebook Pages accessible by this agency in Business Manager' })
  @ApiResponse({ status: 200, description: 'Accessible pages retrieved successfully' })
  async getAgencyAccessiblePages(@Param('agencyAccountId') agencyAccountId: string) {
    const pages = await this.agencyAccountService.getAgencyAccessiblePages(agencyAccountId);
    return {
      success: true,
      data: pages,
      message: `Found ${pages.length} pages accessible by this agency`,
    };
  }

  @Get(':agencyAccountId/accessible-ad-accounts')
  @ApiOperation({ summary: 'Get all ad accounts accessible by this agency in Business Manager' })
  @ApiResponse({ status: 200, description: 'Accessible ad accounts retrieved successfully' })
  async getAgencyAccessibleAdAccounts(@Param('agencyAccountId') agencyAccountId: string) {
    const adAccounts = await this.agencyAccountService.getAgencyAccessibleAdAccounts(agencyAccountId);
    return {
      success: true,
      data: adAccounts,
      message: `Found ${adAccounts.length} ad accounts accessible by this agency`,
    };
  }
}
