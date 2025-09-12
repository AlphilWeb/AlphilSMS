

export default function Footer() {
    return (
        <>
        <footer className=" footer sm:footer-horizontal footer-center bg-base-300 text-base-content px-12 py-6 text-white">
            <aside >
                <p className="text-white">Copyright © {new Date().getFullYear()} - All rights reserved</p>
                <p className="text-white">Powered by iWebX</p>
            </aside>
        </footer>
        </>
    );
}