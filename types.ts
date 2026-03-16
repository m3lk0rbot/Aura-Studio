// Application Types

export enum TabId {
    EDITOR = 'EDITOR',
    SNAPCHAT = 'SNAPCHAT',
    FACEBOOK = 'FACEBOOK',
    INSTAGRAM = 'INSTAGRAM',
    LINKEDIN = 'LINKEDIN',
    TWITTER = 'TWITTER',
    TELEGRAM = 'TELEGRAM',
    PINTEREST = 'PINTEREST',
    REDDIT = 'REDDIT',
}
  
export interface CampaignPost {
    platform: string;
    style: string;
    content: string;
    audioUrl?: string;
}

export interface CampaignImage {
    url: string;
    description: string;
}

export interface CampaignResult {
    summary: string;
    keywords: string[];
    posts: CampaignPost[];
    images: CampaignImage[];
}

export interface GeneratedPost {
    id: string;
    content: string;
    imageUrl?: string;
    visualDescription?: string;
    audioUrl?: string;
    style?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    isPro: boolean;
    role: 'admin' | 'user';
    credits: number;
    createdAt: string;
}

export interface ArchivedPost {
    id: string;
    userId: string;
    platform: string;
    content: string;
    imageUrl?: string;
    visualDescription?: string;
    audioUrl?: string;
    createdAt: string;
}
  
export interface SummaryResult {
    summary: string;
    keywords: string[];
}

export interface ArchivedCampaign extends CampaignResult {
    id: string;
    userId: string;
    createdAt: any;
}

export interface TextAnalysis {
    wordCount: number;
    charCount: number;
    readingTime: number; // minutes
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    complexity: 'Simple' | 'Moderate' | 'Complex';
}