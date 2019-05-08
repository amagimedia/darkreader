import {m} from 'malevic';
import withForms from 'malevic/forms';
import withState, {useState} from 'malevic/state';
import {TabPanel, Button} from '../../controls';
import FilterSettings from './filter-settings';
import {Header, MoreToggleSettings} from './header';
import Loader from './loader';
import MoreSettings from './more-settings';
import {News, NewsButton} from './news';
import SiteListSettings from './site-list-settings';
import {isFirefox} from '../../../utils/platform';
import {getDuration} from '../../../utils/time';
import {DONATE_URL, GITHUB_URL, PRIVACY_URL, TWITTER_URL, getHelpURL} from '../../../utils/links';
import {getLocalMessage} from '../../../utils/locales';
import {ExtensionData, ExtensionActions, TabInfo, News as NewsObject} from '../../../definitions';
import {getURLHost, isURLInList} from '../../../utils/url';

withForms();

interface BodyProps {
    data: ExtensionData;
    tab: TabInfo;
    actions: ExtensionActions;
}

interface BodyState {
    activeTab: string;
    newsOpen: boolean;
    moreToggleSettingsOpen: boolean;
}

function openDevTools() {
    chrome.windows.create({
        type: 'panel',
        url: isFirefox() ? '../devtools/index.html' : 'ui/devtools/index.html',
        width: 600,
        height: 600,
    });
}

function Body(props: BodyProps) {
    const {state, setState} = useState<BodyState>({
        activeTab: 'Filter',
        newsOpen: false,
        moreToggleSettingsOpen: false,
    });
    if (!props.data.isReady) {
        return (
            <body>
                <Loader complete={false} />
            </body>
        )
    }

    const unreadNews = props.data.news.filter(({read}) => !read);

    function toggleNews() {
        if (state.newsOpen && unreadNews.length > 0) {
            props.actions.markNewsAsRead(unreadNews.map(({id}) => id));
        }
        setState({newsOpen: !state.newsOpen});
    }

    function onNewsOpen(...news: NewsObject[]) {
        const unread = news.filter(({read}) => !read);
        if (unread.length > 0) {
            props.actions.markNewsAsRead(unread.map(({id}) => id));
        }
    }

    let displayedNewsCount = unreadNews.length;
    if (unreadNews.length > 0 && !props.data.settings.notifyOfNews) {
        const latest = new Date(unreadNews[0].date);
        const today = new Date();
        const newsWereLongTimeAgo = latest.getTime() < today.getTime() - getDuration({days: 14});
        if (newsWereLongTimeAgo) {
            displayedNewsCount = 0;
        }
    }

    function toggleMoreToggleSettings() {
        setState({moreToggleSettingsOpen: !state.moreToggleSettingsOpen});
    }

    console.log(props);
    const host = getURLHost(props.tab.url || '');
    
    const urlText = (host
        ? host
            .split('.')
            .reduce((elements, part, i) => elements.concat(
                <wbr />,
                `${i > 0 ? '.' : ''}${part}`
            ), [])
        : 'current site');

    return (
        <body class={{'ext-disabled': !props.data.isEnabled}}>
            <Loader complete />

            <Header
                data={props.data}
                tab={props.tab}
                actions={props.actions}
                onMoreToggleSettingsClick={toggleMoreToggleSettings}
            />

            {props.tab.isSupported ? <TabPanel
                activeTab={state.activeTab}
                onSwitchTab={(tab) => setState({activeTab: tab})}
                tabs={{
                    'Filter': (
                        <FilterSettings data={props.data} actions={props.actions} tab={props.tab} />
                    ),
                    // 'Site list': (
                    //     <SiteListSettings data={props.data} actions={props.actions} isFocused={state.activeTab === 'Site list'} />
                    // ),
                    'More': (
                        <MoreSettings data={props.data} actions={props.actions} tab={props.tab} />
                    ),
                }}
                tabLabels={{
                    'Filter': getLocalMessage('filter'),
                    'Site list': getLocalMessage('site_list'),
                    'More': getLocalMessage('more'),
                }}
            /> : <div class="darkreader-unsupported">{urlText} doesn't supported dark theme.</div>}

            <footer>
                <div class="footer-buttons">
                    <Button onclick={openDevTools} class="dev-tools-button">
                        🛠 {getLocalMessage('open_dev_tools')}
                    </Button>
                </div>
            </footer>
            <News
                news={props.data.news}
                expanded={state.newsOpen}
                onNewsOpen={onNewsOpen}
                onClose={toggleNews}
            />
            <MoreToggleSettings
                data={props.data}
                actions={props.actions}
                isExpanded={state.moreToggleSettingsOpen}
                onClose={toggleMoreToggleSettings}
            />
        </body>
    );
}

export default withState(Body);
