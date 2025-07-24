

export default function Footer() {
    return (
        <>
        <footer className="footer sm:footer-horizontal footer-center bg-base-300 text-base-content px-12">
            <aside>
                <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
            </aside>
        </footer>
        </>
    );
}